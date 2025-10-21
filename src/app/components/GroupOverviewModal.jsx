"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Users, Calendar, MessageCircle, TrendingUp, Clock } from "lucide-react";

export function GroupOverviewModal({ 
  open, 
  onOpenChange, 
  groupData,
  className = "" 
}) {
  const handleJoinChat = () => {
    onOpenChange(false);
    // Navigate to group chat - this will be handled by parent component
    window.location.href = `/client/group/${groupData?.id}?groupName=${encodeURIComponent(groupData?.name)}`;
  };

  if (!groupData) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 sm:mx-0">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{groupData.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Group Description */}
          {groupData.description && (
            <div className="text-sm text-muted-foreground">
              {groupData.description}
            </div>
          )}

          {/* Group Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{groupData.members || 0}</p>
                <p className="text-xs text-muted-foreground">Members</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{groupData.attendance || 0}%</p>
                <p className="text-xs text-muted-foreground">Attendance</p>
              </div>
            </div>
          </div>

          {/* Group Members Preview - Show member count and online status */}
          <div>
            <h4 className="text-sm font-medium mb-2">Group Info</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{groupData.members || 0} members</span>
              </div>
              {groupData.maxMembers && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Capacity: {groupData.members}/{groupData.maxMembers}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Group Tags */}
          <div>
            <h4 className="text-sm font-medium mb-2">Focus Areas</h4>
            <div className="flex flex-wrap gap-1">
              {groupData.focusArea && (
                <Badge variant="outline" className="text-xs">
                  {groupData.focusArea}
                </Badge>
              )}
              {groupData.stage && (
                <Badge variant="outline" className="text-xs">
                  {groupData.stage}
                </Badge>
              )}
            </div>
          </div>

          {/* Next Session */}
          {groupData.nextSession && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Next Session</p>
                <p className="text-xs text-muted-foreground">{groupData.nextSession}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleJoinChat}
              className="flex-1"
              size="sm"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Open Chat
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              size="sm"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
