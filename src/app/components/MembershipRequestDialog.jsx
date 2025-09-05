"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";

import { useMembershipRequests } from "@/app/hooks/useMembershipRequests";
export function MembershipRequestDialog({ 
  open, 
  onOpenChange, 
  group, 
  clientId, 
  clientName, 
  clientEmail 
}) {
  const [message, setMessage] = useState("");
  const { createRequest } = useMembershipRequests();

  const handleSubmit = () => {
    if (!group) return;

    const request = createRequest(group.id, clientId, clientName, clientEmail, message);
    
    // Only close dialog if request was successfully created (not a duplicate)
    if (request && request.id.startsWith('req_')) {
      setMessage("");
      onOpenChange(false);
    }
  };

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request to Join "{group.name}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">Group Details:</h4>
            <p className="text-sm text-muted-foreground">{group.description}</p>
            <p className="text-sm text-muted-foreground">
              Category: {group.category} | Members: {group.members}/{group.maxMembers}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Why would you like to join this group? (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share why this group interests you or how you think it might help..."
              className="min-h-[100px]"
            />
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Your request will be sent to the group coach for approval. You'll be notified once they review your request.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Send Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}