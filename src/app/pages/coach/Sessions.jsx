  "use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { PageHeader } from "@/app/components/PageHeader";
import { useSessions } from "@/app/hooks/useSessions";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { ScheduleSessionDialog } from "@/app/components/ScheduleSessionDialog";
import { EditSessionDialog } from "@/app/components/EditSessionDialog";
import { 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  MessageCircle,
  Edit,
  Video,
  List,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";



export default function Sessions() {
  const router = useRouter();
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null);
  const [isSessionDetailOpen, setIsSessionDetailOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [calendarView, setCalendarView] = useState('month');
  const [currentMonth, setCurrentMonth] = useState(() => new Date(2024, 0, 1));
  const [selectedDate, setSelectedDate] = useState(() => new Date(2024, 0, 1));
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');

  // Set current dates after hydration to avoid hydration mismatch
  useEffect(() => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  }, []);

  // Use real data from database
  const { 
    sessions, 
    loading, 
    error, 
    refetchSessions,
    createSession,
    updateSession,
    deleteSession
  } = useSessions();

  // Generate calendar data from real sessions
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth(); // 0-based
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the Monday of the week containing the first day
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, Monday = 1
    startDate.setDate(firstDay.getDate() + mondayOffset);
    
    // Generate 42 days (6 weeks)
    const calendarDays = [];
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const day = currentDate.getDate();
      const isCurrentMonth = currentDate.getMonth() === month;
      const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Check if there are sessions on this date
      const daySessions = sessions.filter(session => {
        const sessionDate = new Date(session.sessionDate);
        return sessionDate.toISOString().split('T')[0] === dateStr;
      });
      
      calendarDays.push({
        day: isCurrentMonth ? day : '',
        isEmpty: !isCurrentMonth,
        hasSession: daySessions.length > 0,
        date: dateStr,
        sessions: daySessions
      });
    }
    
    return calendarDays;
  };

  const generateWeekDays = () => {
    const today = new Date();
    const currentWeekStart = new Date(today);
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    currentWeekStart.setDate(today.getDate() + mondayOffset);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(currentWeekStart);
      currentDate.setDate(currentWeekStart.getDate() + i);
      
      const day = currentDate.getDate();
      const dateStr = currentDate.toISOString().split('T')[0];
      const formattedDate = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Check if there are sessions on this date
      const daySessions = sessions.filter(session => {
        const sessionDate = new Date(session.sessionDate);
        return sessionDate.toISOString().split('T')[0] === dateStr;
      });
      
      weekDays.push({
        day,
        date: formattedDate,
        isEmpty: false,
        hasSession: daySessions.length > 0,
        dateStr,
        sessions: daySessions
      });
    }
    
    return weekDays;
  };

  const generateDayHours = () => {
    const selectedDateObj = new Date(selectedDate);
    const dateStr = selectedDateObj.toISOString().split('T')[0];
    
    // Get sessions for the selected date
    const daySessions = sessions.filter(session => {
      const sessionDate = new Date(session.sessionDate);
      return sessionDate.toISOString().split('T')[0] === dateStr;
    });
    
    // Generate hourly slots from 8 AM to 8 PM
    const hours = [];
    for (let hour = 8; hour <= 20; hour++) {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      
      // Find session at this hour
      const sessionAtHour = daySessions.find(session => {
        const sessionTime = session.sessionTime.substring(0, 5); // Get HH:MM
        return sessionTime === timeStr;
      });
      
      hours.push({
        hour: timeStr,
        isEmpty: false,
        hasSession: !!sessionAtHour,
        session: sessionAtHour ? {
          client: sessionAtHour.client,
          group: sessionAtHour.group,
          type: sessionAtHour.type,
          title: sessionAtHour.title
        } : null
      });
    }
    
    return hours;
  };

  // Calendar navigation handlers
  const handlePreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const handlePreviousDay = () => {
    const newDay = new Date(selectedDate);
    newDay.setDate(newDay.getDate() - 1);
    setSelectedDate(newDay);
  };

  const handleNextDay = () => {
    const newDay = new Date(selectedDate);
    newDay.setDate(newDay.getDate() + 1);
    setSelectedDate(newDay);
  };

  // Format date for display
  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Generate session details for calendar clicks
  const getSessionDetailsForDate = (dateStr) => {
    const daySessions = sessions.filter(session => {
      const sessionDate = new Date(session.sessionDate);
      return sessionDate.toISOString().split('T')[0] === dateStr;
    });
    
    return daySessions.map(session => ({
      time: session.sessionTime.substring(0, 5), // HH:MM format
      client: session.client,
      group: session.group,
      type: session.type,
      mood: session.mood,
      moodEmoji: session.moodEmoji,
      title: session.title,
      id: session.id,
      clientId: session.clientId,
      groupId: session.groupId,
      meetingLink: session.meetingLink
    }));
  };

  const handleDayClick = (day) => {
    // Update selected date for day view
    if (day.date) {
      setSelectedDate(new Date(day.date));
    }
    
    if (day.hasSession && day.sessions && day.sessions.length > 0) {
      const sessionDetails = getSessionDetailsForDate(day.date);
      setSelectedSessionDetail({
        ...sessionDetails[0],
        date: day.date,
        day: day.day,
        allSessions: sessionDetails
      });
      setIsSessionDetailOpen(true);
    }
  };

  const handleJoinSession = (session) => {
    if (session.meetingLink) {
      window.open(session.meetingLink, '_blank');
    } else {
      // Fallback to dialog if no meeting link
      setSelectedSession(session);
      setSelectedSessionDetail({
        ...session,
        date: session.date
      });
      setIsSessionDetailOpen(true);
    }
  };

  const handleViewSession = (session) => {
    setSelectedSession(session);
    setSelectedSessionDetail({
      ...session,
      date: session.date
    });
    setIsSessionDetailOpen(true);
  };

  const handleEditSession = (session) => {
    setSelectedSession(session);
    setIsEditDialogOpen(true);
  };

  const handleMessageSession = (session) => {
    if (session.groupId) {
      // Navigate to group chat using the actual group ID
      router.push(`/coach/group/${session.groupId}`);
    } else if (session.clientId) {
      // Navigate to client chat using the actual client ID
      router.push(`/coach/clients/${session.clientId}`);
    } else {
      console.error('No groupId or clientId found in session:', session);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sortedSessions = [...sessions].sort((a, b) => {
    let aValue;
    let bValue;
    
    switch (sortBy) {
      case 'date':
        aValue = a.date;
        bValue = b.date;
        break;
      case 'client':
        aValue = a.client || a.group || '';
        bValue = b.client || b.group || '';
        break;
      case 'type':
        aValue = a.type;
        bValue = b.type;
        break;
      default:
        aValue = a.date;
        bValue = b.date;
    }
    
    const comparison = aValue.localeCompare(bValue);
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  const renderCalendarView = () => {
    const calendarDays = generateCalendarDays();
    const weekDays = generateWeekDays();
    const dayHours = generateDayHours();
    
    switch (calendarView) {
      case 'month':
        return (
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-muted-foreground mb-4">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((dayObj, index) => (
                <button
                  key={index}
                  className={`
                    h-20 w-full text-sm rounded-lg transition-all relative p-2 flex flex-col
                    ${dayObj.isEmpty 
                      ? 'invisible' 
                      : dayObj.hasSession
                        ? 'bg-primary/20 text-primary font-medium hover:bg-primary/30 cursor-pointer border-2 border-primary/50' 
                        : 'text-foreground hover:bg-muted/50 border border-transparent hover:border-border'
                    }
                  `}
                  onClick={() => handleDayClick(dayObj)}
                  disabled={dayObj.isEmpty}
                >
                  {!dayObj.isEmpty && (
                    <>
                      <div className="text-left font-semibold text-base mb-1">
                        {dayObj.day}
                      </div>
                      {dayObj.hasSession && (
                        <div className="flex-1 flex items-center justify-center">
                          <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            {dayObj.sessions?.length || 0}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      
      case 'week':
        return (
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map((dayObj, index) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
                  </div>
                  <div className="text-sm font-medium">{dayObj.date}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((dayObj, index) => (
                <button
                  key={index}
                  className={`
                    h-32 w-full text-sm rounded-lg transition-all relative p-2 flex flex-col
                    ${dayObj.hasSession
                      ? 'bg-primary/20 text-primary font-medium hover:bg-primary/30 cursor-pointer border-2 border-primary/50' 
                      : 'text-foreground hover:bg-muted/50 border border-transparent hover:border-border'
                    }
                  `}
                  onClick={() => handleDayClick(dayObj)}
                >
                  {dayObj.hasSession && (
                    <div className="space-y-1">
                      {dayObj.sessions?.map((session, idx) => (
                        <div key={idx} className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                          {session.sessionTime.substring(0, 5)}
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      
      case 'day':
        return (
          <div className="bg-muted/30 rounded-lg p-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">{formatDate(selectedDate)}</h3>
                </div>
            <div className="space-y-2">
              {dayHours.map((hour, index) => (
                <div
                  key={index}
                  className={`
                    flex items-center p-3 rounded-lg border transition-all
                    ${hour.hasSession
                      ? 'bg-primary/20 border-primary/50 text-primary'
                      : 'bg-background hover:bg-muted/50 border-transparent hover:border-border'
                    }
                  `}
                >
                  <div className="w-16 text-sm font-medium text-muted-foreground">
                    {hour.hour}
                  </div>
                  {hour.hasSession && hour.session && (
                    <div className="flex-1 flex items-center gap-2 ml-4">
                      <div className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm">
                        {hour.session.client || hour.session.group || hour.session.title}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {hour.session.type}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader 
        title={"Sessions"} 
        subtitle={"Manage your sessions"}
      >
        <Button 
          className="bg-gradient-primary text-[#1A2D4D] shadow-medium hover:shadow-strong transition-all"
          onClick={() => setIsScheduleDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Schedule Session
        </Button>
      </PageHeader>

      {/* Main Sessions Card */}
      <Card className="card-standard">
        <CardHeader>
          <div className="flex items-center justify-between">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Sessions
                </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-muted rounded-lg p-1">
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('list')}
                  className="h-8 px-3"
                >
                  <List className="h-4 w-4 mr-1" />
                  List
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('calendar')}
                  className="h-8 px-3"
                >
                  <CalendarDays className="h-4 w-4 mr-1" />
                  Calendar
                </Button>
              </div>
              {viewMode === 'calendar' && (
                <div className="flex items-center bg-muted rounded-lg p-1">
                  <Button
                    size="sm"
                    variant={calendarView === 'month' ? 'default' : 'ghost'}
                    onClick={() => setCalendarView('month')}
                    className="h-8 px-3"
                  >
                    Month
                  </Button>
                  <Button
                    size="sm"
                    variant={calendarView === 'week' ? 'default' : 'ghost'}
                    onClick={() => setCalendarView('week')}
                    className="h-8 px-3"
                  >
                    Week
                  </Button>
                  <Button
                    size="sm"
                    variant={calendarView === 'day' ? 'default' : 'ghost'}
                    onClick={() => setCalendarView('day')}
                    className="h-8 px-3"
                  >
                    Day
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {viewMode === 'list' ? (
              <div className="space-y-4">
                {/* Sort Controls */}
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">Sort By:</span>
                  <Button
                    size="sm"
                    variant={sortBy === 'date' ? 'default' : 'ghost'}
                    onClick={() => handleSort('date')}
                    className="h-8 px-3"
                  >
                    Date
                    {sortBy === 'date' && (
                      sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant={sortBy === 'client' ? 'default' : 'ghost'}
                    onClick={() => handleSort('client')}
                    className="h-8 px-3"
                  >
                    Client/Group
                    {sortBy === 'client' && (
                      sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant={sortBy === 'type' ? 'default' : 'ghost'}
                    onClick={() => handleSort('type')}
                    className="h-8 px-3"
                  >
                      Type
                    {sortBy === 'type' && (
                      sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                    )}
                  </Button>
                </div>
                
                {/* Sessions List */}
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-muted-foreground">Loading sessions...</div>
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-destructive">Error loading sessions: {error}</div>
                    </div>
                  ) : sortedSessions.length === 0 ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-muted-foreground">No sessions found</div>
                    </div>
                  ) : (
                    sortedSessions.map((session) => (
                  <div 
                    key={session.id} 
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all border border-transparent hover:border-border hover:shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[80px]">
                        <p className="text-sm font-medium text-foreground">
                          {session.date}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {session.group ? (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-foreground">{session.group}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {session.client?.split(' ').map((n) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="text-sm font-medium text-foreground block">{session.client}</span>
                              <span className="text-xs text-muted-foreground">Individual Session</span>
                            </div>
                          </div>
                        )}
                        
                        <Badge 
                          variant="outline" 
                          className={session.type === 'Group' 
                            ? 'border-primary text-primary bg-primary/10' 
                            : 'border-accent text-accent bg-accent/10'
                          }
                        >
                          {session.type}
                        </Badge>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-lg">{session.moodEmoji}</span>
                          <Badge variant="secondary" className="text-xs">
                            {session?.duration ? `${session.duration} min` : (session.type === 'Group' ? '45 min' : '60 min')}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        className="bg-gradient-primary text-[#1A2D4D] hover:shadow-md transition-all"
                        onClick={() => handleJoinSession(session)}
                      >
                        <Video className="h-4 w-4 mr-2" />
                          Join
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="hover:bg-accent hover:text-accent-foreground"
                        onClick={() => handleEditSession(session)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="hover:bg-secondary hover:text-secondary-foreground"
                        onClick={() => handleMessageSession(session)}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  ))
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                 {/* Calendar Navigation */}
                 <div className="flex items-center justify-center">
                   <div className="flex items-center gap-2">
                     <Button 
                       size="sm" 
                       variant="outline" 
                       onClick={calendarView === 'day' ? handlePreviousDay : handlePreviousMonth}
                     >
                       <ChevronLeft className="h-4 w-4" />
                     </Button>
                     <h3 className="text-lg font-semibold text-foreground min-w-[120px] text-center">
                       {calendarView === 'day' ? formatDate(selectedDate) : formatMonthYear(currentMonth)}
                     </h3>
                     <Button 
                       size="sm" 
                       variant="outline" 
                       onClick={calendarView === 'day' ? handleNextDay : handleNextMonth}
                     >
                       <ChevronRight className="h-4 w-4" />
                     </Button>
                   </div>
                 </div>

                {/* Calendar Grid */}
                {renderCalendarView()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Session Dialog */}
      <ScheduleSessionDialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
        onSessionCreated={refetchSessions}
        groupName="General Group"
        groupMembers={8}
      />

      {/* Session Detail Dialog */}
      <Dialog open={isSessionDetailOpen} onOpenChange={setIsSessionDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Session Details - {selectedSessionDetail?.date}
            </DialogTitle>
          </DialogHeader>
          
          {selectedSessionDetail && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 border">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-medium">{selectedSessionDetail.time}</span>
                  </div>
                  
                  {selectedSessionDetail.group ? (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span>{selectedSessionDetail.group}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {selectedSessionDetail.client?.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span>{selectedSessionDetail.client}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-primary text-primary">
                      {selectedSessionDetail.type}
                    </Badge>
                    <span className="text-lg">{selectedSessionDetail.moodEmoji}</span>
                  </div>
                </div>
              </div>

              {/* Show all sessions for this day if multiple */}
              {selectedSessionDetail.allSessions && selectedSessionDetail.allSessions.length > 1 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">All Sessions Today:</h4>
                  {selectedSessionDetail.allSessions.map((session, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/20 border">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{session.time}</span>
                        <span className="text-sm">{session.group || session.client}</span>
                        <Badge variant="outline" className="text-xs">{session.type}</Badge>
                      </div>
                      <span className="text-sm">{session.moodEmoji}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    if (selectedSessionDetail?.meetingLink) {
                      window.open(selectedSessionDetail.meetingLink, '_blank');
                    }
                  }}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Join Session
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Session Dialog */}
      <EditSessionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        session={selectedSession}
        onSessionUpdated={refetchSessions}
      />
    </div>
  );
}