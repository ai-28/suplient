  "use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { PageHeader } from "@/app/components/PageHeader";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { ScheduleSessionDialog } from "@/app/components/ScheduleSessionDialog";
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

const upcomingSessions = [
  { 
    id: 1, 
    date: "13 Jan 14:00", 
    group: "Group 3", 
    type: "Group",
    mood: "😊", 
    actions: ["view", "edit", "message"] 
  },
  { 
    id: 2, 
    date: "5 May 10:00", 
    client: "John Doe", 
    type: "1-1",
    mood: "😐", 
    actions: ["view", "edit", "message"] 
  },
  { 
    id: 3, 
    date: "6 Aug 14:00", 
    client: "Alex Bob", 
    type: "1-1",
    mood: "😊", 
    actions: ["view", "edit", "message"] 
  },
  { 
    id: 4, 
    date: "6 May 14:00", 
    client: "Sarah Connor", 
    type: "1-1",
    mood: "😊", 
    actions: ["view", "edit", "message"] 
  },
  { 
    id: 5, 
    date: "6 May 16:00", 
    group: "Group 2", 
    type: "Group",
    mood: "😊", 
    actions: ["view", "edit", "message"] 
  }
];

// Calendar days with proper layout - starting from Monday (May 5, 2025)
const calendarDays = [
  { day: 5, isEmpty: false, hasSession: true }, // Mon
  { day: 6, isEmpty: false, hasSession: true }, // Tue
  { day: 7, isEmpty: false }, // Wed
  { day: 8, isEmpty: false }, // Thu
  { day: 9, isEmpty: false }, // Fri
  { day: 10, isEmpty: false }, // Sat
  { day: 11, isEmpty: false }, // Sun
  
  { day: 12, isEmpty: false }, // Mon
  { day: 13, isEmpty: false, hasSession: true }, // Tue
  { day: 14, isEmpty: false }, // Wed
  { day: 15, isEmpty: false }, // Thu
  { day: 16, isEmpty: false }, // Fri
  { day: 17, isEmpty: false }, // Sat
  { day: 18, isEmpty: false }, // Sun
  
  { day: 19, isEmpty: false }, // Mon
  { day: 20, isEmpty: false }, // Tue
  { day: 21, isEmpty: false }, // Wed
  { day: 22, isEmpty: false }, // Thu
  { day: 23, isEmpty: false }, // Fri
  { day: 24, isEmpty: false }, // Sat
  { day: 25, isEmpty: false }, // Sun
  
  { day: 26, isEmpty: false }, // Mon
  { day: 27, isEmpty: false }, // Tue
  { day: 28, isEmpty: false }, // Wed
  { day: 29, isEmpty: false }, // Thu
  { day: 30, isEmpty: false }, // Fri
  { day: 31, isEmpty: false }, // Sat
  { day: "", isEmpty: true }, // Sun
];

// Week view data - 7 days starting Monday
const weekDays = [
  { day: 5, date: "May 5", isEmpty: false, hasSession: true },
  { day: 6, date: "May 6", isEmpty: false, hasSession: true },
  { day: 7, date: "May 7", isEmpty: false },
  { day: 8, date: "May 8", isEmpty: false },
  { day: 9, date: "May 9", isEmpty: false },
  { day: 10, date: "May 10", isEmpty: false },
  { day: 11, date: "May 11", isEmpty: false },
];

// Day view data - hourly slots
const dayHours = [
  { hour: "08:00", isEmpty: false },
  { hour: "09:00", isEmpty: false },
  { hour: "10:00", isEmpty: false, hasSession: true, session: { client: "John Doe", type: "1-1" } },
  { hour: "11:00", isEmpty: false },
  { hour: "12:00", isEmpty: false },
  { hour: "13:00", isEmpty: false },
  { hour: "14:00", isEmpty: false, hasSession: true, session: { client: "Alex Bob", type: "1-1" } },
  { hour: "15:00", isEmpty: false },
  { hour: "16:00", isEmpty: false, hasSession: true, session: { group: "Group 2", type: "Group" } },
  { hour: "17:00", isEmpty: false },
  { hour: "18:00", isEmpty: false },
];

// Session details for specific days - now supporting multiple sessions per day
const sessionDetails = {
  5: [{ time: "10:00", client: "John Doe", type: "1-1", mood: "😐" }],
  6: [
    { time: "14:00", client: "Alex Bob", type: "1-1", mood: "😊" },
    { time: "16:00", group: "Group 2", type: "Group", mood: "😊" }
  ],
  13: [{ time: "14:00", group: "Group 3", type: "Group", mood: "😊" }]
};

export default function Sessions() {
  const router = useRouter();
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null);
  const [isSessionDetailOpen, setIsSessionDetailOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [calendarView, setCalendarView] = useState('month');
  const [currentMonth, setCurrentMonth] = useState('May 2025');
  const [selectedDate, setSelectedDate] = useState('May 6, 2025');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');

  const handleDayClick = (day) => {
    if (day.hasSession && sessionDetails[day.day]) {
      const sessions = sessionDetails[day.day];
      setSelectedSessionDetail({
        ...sessions[0],
        date: `${day.day} May`,
        day: day.day,
        allSessions: sessions
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
    if (session.group) {
      // Map group names to group IDs - in a real app this would come from the session data
      const groupId = session.group === "Group 1" ? "1" : 
                     session.group === "Group 2" ? "2" : 
                     session.group === "Group 3" ? "3" : "1";
      router.push(`/coach/group/${groupId}`);
    } else {
      // Map client names to client IDs - in a real app this would come from the session data
      const clientId = session.client === "John Doe" ? "1" : 
                       session.client === "Alex Bob" ? "2" : 
                       session.client === "Sarah Connor" ? "3" : "1";
      router.push(`/coach/clients/${clientId}`);
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

  const sortedSessions = [...upcomingSessions].sort((a, b) => {
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
                            {sessionDetails[dayObj.day]?.length || 0}
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
                      {sessionDetails[dayObj.day]?.map((session, idx) => (
                        <div key={idx} className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                          {session.time}
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
                  <h3 className="text-lg font-semibold">{selectedDate}</h3>
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
                        {hour.session.client || hour.session.group}
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
          className="bg-gradient-primary text-white shadow-medium hover:shadow-strong transition-all"
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
                  {sortedSessions.map((session) => (
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
                          <span className="text-lg">{session.mood}</span>
                          <Badge variant="secondary" className="text-xs">
                            {session.type === 'Group' ? '45 min' : '60 min'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        className="bg-gradient-primary text-white hover:shadow-md transition-all"
                        onClick={() => handleViewSession(session)}
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
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                 {/* Calendar Navigation */}
                 <div className="flex items-center justify-center">
                   <div className="flex items-center gap-2">
                     <Button size="sm" variant="outline" onClick={() => setCurrentMonth('April 2025')}>
                       <ChevronLeft className="h-4 w-4" />
                     </Button>
                     <h3 className="text-lg font-semibold text-foreground min-w-[120px] text-center">
                       {calendarView === 'day' ? selectedDate : currentMonth}
                     </h3>
                     <Button size="sm" variant="outline" onClick={() => setCurrentMonth('June 2025')}>
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
                    <span className="text-lg">{selectedSessionDetail.mood}</span>
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
                      <span className="text-sm">{session.mood}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <Video className="h-4 w-4 mr-2" />
                  Join Session
                </Button>
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button size="sm" variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Session Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit Session
            </DialogTitle>
          </DialogHeader>
          
          {selectedSession && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <div className="p-2 border rounded bg-muted/30">
                    {selectedSession.date.split(' ')[0]}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Time</label>
                  <div className="p-2 border rounded bg-muted/30">
                    {selectedSession.date.split(' ')[1]}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">
                  {selectedSession.group ? "Group" : "Client"}
                </label>
                <div className="p-2 border rounded bg-muted/30">
                  {selectedSession.group || selectedSession.client}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Type</label>
                <div className="p-2 border rounded bg-muted/30">
                  {selectedSession.type}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  className="flex-1" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                    Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}