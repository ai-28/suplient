"use client"
import { useTranslation } from "@/app/context/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/app/components/ui/alert-dialog";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Check, X, Clock, MessageSquare, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function MembershipRequestsPanel({ groupId, showAllRequests = false }) {
  const t = useTranslation();
  // Mock functions for membership requests
  const getPendingRequests = () => {
    return [
      {
        id: 1,
        userId: "user1",
        userName: "John Doe",
        userEmail: "john@example.com",
        groupId: 1,
        status: "pending",
        requestedAt: new Date().toISOString(),
        message: "I'd like to join this group to work on my anxiety management."
      }
    ];
  };

  const getRequestsByGroup = (groupId) => {
    return getPendingRequests().filter(request => request.groupId === groupId);
  };
  
  const requests = showAllRequests 
    ? getPendingRequests() 
    : groupId 
      ? getRequestsByGroup(groupId).filter(r => r.status === "pending")
      : [];

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('groups.membershipRequests', 'Membership Requests')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('groups.noPendingRequests', 'No Pending Requests')}</h3>
            <p className="text-muted-foreground">
              {showAllRequests 
                ? t('groups.noPendingRequestsAtMoment', 'There are no pending membership requests at the moment.')
                : t('groups.noPendingRequestsForGroup', 'This group has no pending membership requests.')
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {t('groups.membershipRequests', 'Membership Requests')} ({requests.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {request.clientName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{request.clientName}</h4>
                      <p className="text-sm text-muted-foreground">{request.clientEmail}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(request.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {t('common.status.pending', 'Pending')}
                  </Badge>
                </div>

                {showAllRequests && (
                  <div className="text-sm">
                    <span className="font-medium">Group: </span>
                    <span className="text-muted-foreground">Group #{request.groupId}</span>
                  </div>
                )}

                {request.message && (
                  <div className="bg-muted p-3 rounded-md">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium mb-1">Message from client:</p>
                        <p className="text-sm text-muted-foreground">{request.message}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" className="flex-1">
                        <Check className="h-4 w-4 mr-2" />
                        {t('groups.approve', 'Approve')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('groups.approveMembershipRequest', 'Approve Membership Request')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('groups.confirmApproveMembership', "Are you sure you want to approve {name}'s request to join the group? They will be added as an active member and notified of their acceptance.", { name: request.clientName }).replace('{name}', request.clientName)}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.buttons.cancel', 'Cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => approveRequest(request.id)}>
                          {t('groups.approveRequest', 'Approve Request')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="flex-1">
                        <X className="h-4 w-4 mr-2" />
                        {t('groups.decline', 'Decline')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('groups.declineMembershipRequest', 'Decline Membership Request')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('groups.confirmDeclineMembership', "Are you sure you want to decline {name}'s request to join the group? They will be notified that their request was not approved.", { name: request.clientName }).replace('{name}', request.clientName)}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.buttons.cancel', 'Cancel')}</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => declineRequest(request.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('groups.declineRequest', 'Decline Request')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}