"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, X, Trash2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { useNotifications } from '@/app/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

const notificationIcons = {
  client_signup: '👤',
  task_completed: '✅',
  daily_checkin: '📝',
  new_message: '💬',
  resource_shared: '📁',
  session_reminder: '⏰',
  goal_achieved: '🎯',
  system: '⚙️',
  group_join_request: '👥',
  other: '🔔'
};

const notificationColors = {
  low: 'text-gray-600',
  normal: 'text-blue-600',
  high: 'text-orange-600',
  urgent: 'text-red-600'
};

export function NotificationBell({ userRole = 'client' }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    loading, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications({ limit: 20, isRead: false });

  // Filter notifications based on user role and relationships
  const filteredNotifications = notifications.filter(notification => {
    if (userRole === 'coach') {
      // Coaches see: client signup, task completion, daily checkin, new messages from THEIR OWN CLIENTS, system notifications, and group join requests
      const allowedTypes = ['client_signup', 'task_completed', 'daily_checkin', 'new_message', 'system', 'group_join_request'];
      if (!allowedTypes.includes(notification.type)) return false;
      
      // For client-related notifications, check if the client belongs to this coach
      if (notification.data?.clientId) {
        // This will be handled by the backend - only notifications for this coach's clients should be sent
        return true;
      }
      
      // For new messages, check if it's from a client of this coach
      if (notification.type === 'new_message' && notification.data?.senderId) {
        // This will be handled by the backend - only messages from clients should be sent to coach
        return true;
      }
      
      return true;
    } else if (userRole === 'client') {
      // Clients see: new messages from THEIR COACH, shared resources from THEIR COACH, session reminders, etc.
      const allowedTypes = ['new_message', 'resource_shared', 'session_reminder', 'goal_achieved', 'system'];
      if (!allowedTypes.includes(notification.type)) return false;
      
      // For new messages, check if it's from their coach
      if (notification.type === 'new_message' && notification.data?.senderId) {
        // This will be handled by the backend - only messages from their coach should be sent
        return true;
      }
      
      // For resource sharing, check if it's from their coach
      if (notification.type === 'resource_shared' && notification.data?.coachId) {
        // This will be handled by the backend - only resources from their coach should be sent
        return true;
      }
      
      return true;
    }
    return true; // Admin or other roles see all notifications
  });

  // Calculate filtered unread count (since we already fetch only unread notifications, this is just the length)
  const filteredUnreadCount = filteredNotifications.length;

  const handleNotificationClick = async (notification) => {
    await markAsRead(notification.id);
    setIsOpen(false);
    
    // Navigate based on notification type
    if (notification.type === 'resource_shared') {
      router.push('/client/resources');
    } else if (notification.type === 'new_message') {
      // Navigate to chat - you might want to add conversation ID to the data
      router.push('/client/chat');
    } else if (notification.type === 'task_completed') {
      router.push('/client/tasks');
    } else if (notification.type === 'daily_checkin') {
      router.push('/client/journal');
    }
    // Add more navigation cases as needed
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {filteredUnreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {filteredUnreadCount > 99 ? '99+' : filteredUnreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Notifications ({filteredUnreadCount})</CardTitle>
              {filteredUnreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleMarkAllRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading notifications...
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No unread notifications
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                        !notification.isRead ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-lg">
                          {notificationIcons[notification.type] || notificationIcons.other}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-medium truncate ${
                              !notification.isRead ? 'font-semibold' : ''
                            }`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center space-x-1">
                              <span className={`text-xs ${notificationColors[notification.priority]}`}>
                                {notification.priority}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleDeleteNotification(e, notification.id)}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationBell;
