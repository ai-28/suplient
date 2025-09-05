"use client"

import React from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Progress } from '@/app/components/ui/progress';
import { User, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const getStatusColor = (status) => {
  switch (status) {
    case 'on-track':
      return 'bg-green-500/10 text-green-600 border-green-200';
    case 'behind':
      return 'bg-red-500/10 text-red-600 border-red-200';
    case 'ahead':
      return 'bg-blue-500/10 text-blue-600 border-blue-200';
    case 'completed':
      return 'bg-purple-500/10 text-purple-600 border-purple-200';
    default:
      return 'bg-gray-500/10 text-gray-600 border-gray-200';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'on-track':
      return <Clock className="h-3 w-3" />;
    case 'behind':
      return <AlertCircle className="h-3 w-3" />;
    case 'ahead':
      return <CheckCircle2 className="h-3 w-3" />;
    case 'completed':
      return <CheckCircle2 className="h-3 w-3" />;
    default:
      return <Clock className="h-3 w-3" />;
  }
};

export default function EnrolledMembersDialog({
  isOpen,
  onClose,
  programName,
  enrolledClients
}) {
  const router = useRouter();

  const handleClientClick = (clientId) => {
    router.push(`/coach/clients/${clientId}?tab=programs`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Enrolled Members - {programName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {enrolledClients.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No enrolled clients</h3>
              <p className="text-muted-foreground">
                This program doesn't have any enrolled clients yet.
              </p>
            </div>
          ) : (
            enrolledClients.map((client) => {
              const completionRate = (client.progress.completedElements / client.progress.totalElements) * 100;
              
              return (
                <div 
                  key={client.id} 
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleClientClick(client.id)}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={client.avatar} alt={client.name} />
                    <AvatarFallback>
                      {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{client.name}</h4>
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(client.progress.status)}
                      >
                        {getStatusIcon(client.progress.status)}
                        <span className="ml-1 capitalize">
                          {client.progress.status.replace('-', ' ')}
                        </span>
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{client.progress.completedElements}/{client.progress.totalElements} elements</span>
                      </div>
                      <Progress value={completionRate} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Day {client.progress.currentDay}</span>
                        <span>{Math.round(completionRate)}% complete</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Enrolled on {client.enrolledDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}