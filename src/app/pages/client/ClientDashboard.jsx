"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/app/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { 
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Calendar,
  Clock,
  MapPin,
  Users,
  User as UserIcon
} from "lucide-react";
import { NotificationBell } from "@/app/components/NotificationBell";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { GoalAnalyticsChart } from "@/app/components/GoalAnalyticsChart";
import { StreakCounter } from "@/app/components/StreakCounter";
import { useAuth } from "../../context/AuthContext";
import { signOut } from "next-auth/react";
import { useSocket } from "@/app/hooks/useSocket";


// Custom hooks with real data
const useGoalTracking = (period) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Guard to avoid duplicate fetches in React 18 Strict Mode during development
  const hasFetchedRef = useRef({});
  const lastVisibilityFetchAtRef = useRef(0);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics?period=${period}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch once per period value per mount
    if (hasFetchedRef.current[period]) return;
    hasFetchedRef.current[period] = true;
    fetchAnalytics();
  }, [period]);

  // Refresh when component becomes visible (after navigation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) return;
      // Throttle visibility-triggered refetch to once every 30s
      const now = Date.now();
      if (now - lastVisibilityFetchAtRef.current < 30000) return;
      lastVisibilityFetchAtRef.current = now;
      fetchAnalytics();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [period]);

  return {
    analyticsData,
    loading,
    error,
    refetch: fetchAnalytics
  };
};

const useUpcomingSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setSessionsLoading(true);
        const response = await fetch('/api/sessions/upcoming');
        if (!response.ok) {
          throw new Error('Failed to fetch upcoming sessions');
        }
        const data = await response.json();
        console.log('📅 Upcoming sessions data:', data.upcomingSessions);
        if (data.upcomingSessions && data.upcomingSessions.length > 0) {
          console.log('👤 First session therapist avatar:', data.upcomingSessions[0].therapistAvatar);
        }
        setSessions(data.upcomingSessions || []);
      } catch (err) {
        setSessionsError(err.message);
        console.error('Error fetching sessions:', err);
      } finally {
        setSessionsLoading(false);
      }
    };

    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchSessions();
  }, []);

  return {
    sessions,
    sessionsLoading,
    sessionsError
  };
};




export default function ClientDashboard() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("today");
  const [selectedSession, setSelectedSession] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const {user}=useAuth();
  
  // Component is now completely client-side, no hydration issues
  
  // Initialize socket connection for real-time notifications
  useSocket();
  
  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const { analyticsData, loading, error, refetch } = useGoalTracking(activeTab);
  const { sessions: upcomingSessions, sessionsLoading, sessionsError } = useUpcomingSessions();
  
  // Memoize gamification calculations
  const gamification = useMemo(() => {
    if (!analyticsData) return { streak: 0, totalPoints: 0, level: 1, pointsToNextLevel: 100 };
    
    const totalPoints = analyticsData.totalEngagementPoints || 0;
    const level = Math.floor(totalPoints / 100) + 1;
    const pointsToNextLevel = (level * 100) - totalPoints;
    
    return {
      streak: analyticsData.dailyStreak || 0,
      totalPoints,
      level,
      pointsToNextLevel
    };
  }, [analyticsData]);

  // Removed extra refetch-on-mount to avoid multiple visible refreshes in dev

  const handleTimePeriodChange = (period) => {
    if (period !== activeTab) {
      setActiveTab(period);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleViewSession = (session) => {
    setSelectedSession(session);
    setIsDialogOpen(true);
  };

  const handleJoinSession = (session) => {
    if (session.meetingLink) {
      window.open(session.meetingLink, '_blank', 'noopener,noreferrer');
    }
  };


  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="bg-red-50 border-b border-red-200 p-2 text-center">
          <p className="text-sm text-red-800">You're offline. Some features may be limited.</p>
        </div>
      )}
      {/* Sticky Topbar: header + date controls */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        {/* Header with Profile */}
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-semibold text-foreground">Mental Health</h1>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <NotificationBell userRole="client" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Avatar className="h-8 w-8">
                    {user?.avatar && (
                      <AvatarImage
                        src={user.avatar}
                        alt={user?.name || 'Profile'}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback>
                      {user?.name ? user.name.slice(0, 2).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => router.push('/client/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Date navigator */}
        <div className="flex items-center justify-center p-4 bg-card border-t border-border">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigateDate('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="mx-8 text-center">
            <h2 className="text-lg font-semibold">{formatDate(currentDate)}</h2>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigateDate('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Analytics Chart */}
        {loading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Loading analytics...</div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-red-500">Error loading analytics: {error}</div>
            </CardContent>
          </Card>
        ) : (
          <GoalAnalyticsChart 
            data={analyticsData?.goalDistribution || []}
            historicalData={analyticsData?.historicalData || []}
            onTimePeriodChange={handleTimePeriodChange}
            selectedPeriod={activeTab}
          />
        )}  

        {/* Next Session */}
        {sessionsLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Loading upcoming sessions...</div>
            </CardContent>
          </Card>
        ) : sessionsError ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-red-500">Error loading sessions: {sessionsError}</div>
            </CardContent>
          </Card>
        ) : upcomingSessions.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next Session</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar>
                  {upcomingSessions[0].therapistAvatar ? (
                    <AvatarImage
                      src={upcomingSessions[0].therapistAvatar}
                      alt={upcomingSessions[0].therapist || 'Therapist'}
                      className="object-cover"
                      onError={(e) => {
                        console.error('❌ Avatar image failed to load:', upcomingSessions[0].therapistAvatar);
                        e.target.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('✅ Avatar image loaded successfully:', upcomingSessions[0].therapistAvatar);
                      }}
                    />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {upcomingSessions[0].therapist && upcomingSessions[0].therapist.trim()
                      ? upcomingSessions[0].therapist.split(' ').map((n) => n && n[0] ? n[0] : '').filter(Boolean).join('').toUpperCase().slice(0, 2) || 'U'
                      : 'U'
                    }
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{upcomingSessions[0].therapist}</p>
                  <p className="text-sm text-muted-foreground">
                    {upcomingSessions[0].date} at {upcomingSessions[0].time}
                  </p>
                  {upcomingSessions[0].title && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {upcomingSessions[0].title}
                    </p>
                  )}
                </div>
                <Button 
                  size="sm"
                  onClick={() => upcomingSessions[0].meetingLink 
                    ? handleJoinSession(upcomingSessions[0])
                    : handleViewSession(upcomingSessions[0])
                  }
                >
                  {upcomingSessions[0].meetingLink ? 'Join' : 'View'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                No upcoming sessions scheduled
              </div>
            </CardContent>
          </Card>
        )}

        {/* Streak Counter */}
        <StreakCounter
          streak={gamification.streak}
          totalPoints={gamification.totalPoints}
          level={gamification.level}
          pointsToNextLevel={gamification.pointsToNextLevel}
        />
      </div>

      {/* Session Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedSession?.type === 'Group' ? (
                <Users className="h-5 w-5" />
              ) : (
                <UserIcon className="h-5 w-5" />
              )}
              {selectedSession?.title || 'Session Details'}
            </DialogTitle>
            <DialogDescription>
              {selectedSession?.type} session with {selectedSession?.therapist}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSession && (
            <div className="space-y-4">
              {/* Session Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{selectedSession.date}</p>
                    <p className="text-xs text-muted-foreground">Session Date</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{selectedSession.time}</p>
                    <p className="text-xs text-muted-foreground">
                      Duration: {selectedSession.duration} minutes
                    </p>
                  </div>
                </div>
                
                {selectedSession.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{selectedSession.location}</p>
                      <p className="text-xs text-muted-foreground">Location</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedSession.description && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedSession.description}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                {selectedSession.meetingLink && (
                  <Button 
                    onClick={() => handleJoinSession(selectedSession)}
                    className="flex-1"
                  >
                    Join Session
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
