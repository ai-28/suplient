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
import { toast } from 'sonner';

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
  low: 'text-gray-600 dark:text-gray-400',
  normal: 'text-blue-600 dark:text-blue-400',
  high: 'text-orange-600 dark:text-orange-400',
  urgent: 'text-red-600 dark:text-red-400'
};

export function NotificationBell({ userRole = 'client' }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { 
    notifications, 
    loading, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications({ limit: 50 }); // Fetch all notifications (read and unread)

  // Check notification preference on mount
  useEffect(() => {
    const checkPreference = async () => {
      try {
        const response = await fetch('/api/user/profile');
        const data = await response.json();
        if (data.success && data.user?.notificationsEnabled !== undefined) {
          setNotificationsEnabled(data.user.notificationsEnabled !== false);
        } else {
          // Fallback to localStorage
          const saved = localStorage.getItem('notificationsEnabled');
          setNotificationsEnabled(saved !== 'false');
        }
      } catch (error) {
        // Fallback to localStorage
        const saved = localStorage.getItem('notificationsEnabled');
        setNotificationsEnabled(saved !== 'false');
      }
    };
    checkPreference();
  }, []);

  // If notifications are disabled, return empty bell
  if (!notificationsEnabled) {
    return (
      <Button variant="ghost" size="sm" className="relative">
        <Bell className="h-5 w-5 opacity-50" />
      </Button>
    );
  }

  // Filter notifications based on user role (show both read and unread)
  const filteredNotifications = notifications.filter(notification => {
    if (userRole === 'admin') {
      // Admins see all their notifications
      return true;
    } else if (userRole === 'coach') {
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
    return true; // Default: show all notifications
  });

  // Calculate unread count from filtered notifications
  const filteredUnreadCount = filteredNotifications.filter(n => !n.isRead).length;

  const handleNotificationClick = async (notification) => {
    // Only mark as read if it's unread
    if (!notification.isRead) {
    await markAsRead(notification.id);
    }
    setIsOpen(false);
    
    // // Navigate based on notification type
    // if (notification.type === 'resource_shared') {
    //   router.push('/client/resources');
    // } else if (notification.type === 'new_message') {
    //   // Navigate to chat - you might want to add conversation ID to the data
    //   router.push('/client/chat');
    // } else if (notification.type === 'task_completed') {
    //   router.push('/client/tasks');
    // } else if (notification.type === 'daily_checkin') {
    //   router.push('/client/journal');
    // }
    // Add more navigation cases as needed
  };

  const handleClearAll = async () => {
    toast('Are you sure you want to clear all notifications?', {
      description: 'This action cannot be undone.',
      action: {
        label: 'Clear',
        onClick: async () => {
    await markAllAsRead();
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
      duration: 5000,
    });
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
      <PopoverContent className="w-80 p-0 bg-background dark:bg-background" align="end">
        <Card className="border-0 shadow-none bg-background dark:bg-background">
          <CardHeader className="pb-3 border-b border-border dark:border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-foreground dark:text-foreground">
                Notifications {filteredUnreadCount > 0 && `(${filteredUnreadCount} unread)`}
              </CardTitle>
              {filteredNotifications.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearAll}
                  className="text-xs text-foreground dark:text-foreground hover:bg-destructive/10 dark:hover:bg-destructive/20 hover:text-destructive"
                >
                  Clear all
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground dark:text-muted-foreground">
                  Loading notifications...
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground dark:text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No notifications
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`group p-3 border-b border-border dark:border-border cursor-pointer transition-colors ${
                        !notification.isRead 
                          ? 'bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/50 dark:hover:bg-blue-950/40 border-l-4 border-l-blue-500' 
                          : 'bg-background dark:bg-background hover:bg-muted/50 dark:hover:bg-muted/50 opacity-70'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-lg">
                          {notificationIcons[notification.type] || notificationIcons.other}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm truncate text-foreground dark:text-foreground ${
                              !notification.isRead ? 'font-semibold' : 'font-normal'
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
                                className="h-6 w-6 p-0 opacity-60 hover:opacity-100 transition-opacity hover:bg-destructive/10 dark:hover:bg-destructive/20"
                              >
                                <X className="h-3 w-3 text-foreground dark:text-foreground" />
                              </Button>
                            </div>
                          </div>
                          <p className={`text-xs mt-1 line-clamp-2 ${
                            !notification.isRead 
                              ? 'text-foreground dark:text-foreground' 
                              : 'text-muted-foreground dark:text-muted-foreground'
                          }`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full flex-shrink-0 mt-2" />
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
