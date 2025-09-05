"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import { PageHeader } from "@/app/components/PageHeader";
import { CreateClientDialog } from "@/app/components/CreateClientDialog";
import { 
  Users, 
  MessageCircle,
  Calendar,
  Settings,
  Filter,
  List,
  LayoutGrid,
  TrendingUp,
  UserPlus,
  CalendarCheck,
  Trophy,
  UserX,
  ChevronDown,
  ArrowUpDown,
  StickyNote
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel
} from "@/app/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

const clients = [
  { id: 1, name: "John Doe", type: "Personal", status: "Active", lastActive: "16/01 14:30", created: "01/01 09:00", mood: "😊", stage: "light", scheduledSession: "18/01 15:30", unreadMessages: 2, lastMessage: "Thanks for the session today. Looking forward to our next meeting.", lastNote: "Client is making excellent progress with anxiety management techniques. We discussed breathing exercises and he's been practicing regularly. Plans to increase meditation time to 15 minutes daily." },
  { id: 2, name: "Alex Bob", type: "Group", status: "Active", lastActive: "15/01 16:45", created: "15/12 10:30", mood: "😐", stage: "group", scheduledSession: "19/01 10:00", unreadMessages: 0, lastMessage: "See you in the group session tomorrow.", lastNote: "Shows good participation in group settings. Sometimes hesitant to share personal experiences but is opening up gradually. Responds well to peer feedback and validation." },
  { id: 3, name: "Sarah Wilson", type: "Personal", status: "Active", lastActive: "16/01 11:20", created: "05/01 14:00", mood: "😊", stage: "personal", scheduledSession: null, unreadMessages: 1, lastMessage: "I've been practicing the mindfulness techniques we discussed.", lastNote: "Significant improvement in stress management. Sarah has been consistently applying mindfulness techniques in work situations. Considering introducing more advanced relaxation methods next session." },
  { id: 4, name: "Mike Johnson", type: "Group", status: "Inactive", lastActive: "13/01 09:15", created: "20/11 08:45", mood: "😔", stage: "inactive", scheduledSession: null, unreadMessages: 0, lastMessage: "Thank you for all your help during my difficult time.", lastNote: "Client completed therapy program successfully. Made substantial progress in dealing with grief and loss. Developed strong coping mechanisms and support network. Ready for independent management." },
  { id: 5, name: "Emma Davis", type: "Personal", status: "Active", lastActive: "16/01 13:10", created: "02/01 16:20", mood: "😊", stage: "light", scheduledSession: "20/01 14:15", unreadMessages: 3, lastMessage: "I have some questions about the homework assignment you gave me.", lastNote: "Very motivated client. Completes all assigned exercises and asks thoughtful questions. Working on building self-confidence and assertiveness skills. Homework includes daily affirmations and social interaction goals." },
  { id: 6, name: "David Lee", type: "Group", status: "Active", lastActive: "14/01 17:30", created: "10/12 11:15", mood: "😊", stage: "group", scheduledSession: null, unreadMessages: 0, lastMessage: "Great group session yesterday! Really helpful insights.", lastNote: "Natural leader in group sessions. Provides excellent support to other members while working on his own communication patterns. Consider transitioning to personal sessions for deeper work." },
  { id: 7, name: "Lisa Chen", type: "Personal", status: "Active", lastActive: "16/01 15:45", created: "30/11 13:30", mood: "😊", stage: "completed", scheduledSession: "17/01 16:45", unreadMessages: 1, lastMessage: "I wanted to update you on my progress with the exercises.", lastNote: "Ready for therapy completion. Has developed excellent self-awareness and coping strategies. Final session scheduled to review progress and create maintenance plan for continued growth." },
  { id: 8, name: "Tom Brown", type: "Group", status: "Active", lastActive: "15/01 12:20", created: "05/12 09:45", mood: "😊", stage: "personal", scheduledSession: "21/01 11:30", unreadMessages: 0, lastMessage: "Looking forward to transitioning to individual sessions.", lastNote: "Transitioned from group to individual therapy. Focus on career-related stress and perfectionism. Very analytical approach to problem-solving. Needs help with emotional processing techniques." },
  { id: 9, name: "Anna Rodriguez", type: "Personal", status: "Active", lastActive: "16/01 10:15", created: "03/01 15:00", mood: "😊", stage: "light", scheduledSession: null, unreadMessages: 2, lastMessage: "I found the resources you shared very helpful for my anxiety.", lastNote: "Responding well to cognitive behavioral therapy techniques. Anxiety levels decreasing with exposure therapy. Needs continued support with panic attack management strategies." },
  { id: 10, name: "Chris Martinez", type: "Group", status: "Active", lastActive: "14/01 14:50", created: "20/12 12:30", mood: "😐", stage: "group", scheduledSession: "22/01 13:00", unreadMessages: 0, lastMessage: "The group dynamics have been really supportive lately.", lastNote: "Benefits greatly from group support but still struggles with trust issues. Making slow but steady progress. Group environment helps him feel less isolated in his experiences." },
  { id: 11, name: "Jessica Taylor", type: "Personal", status: "Active", lastActive: "16/01 16:05", created: "04/01 10:15", mood: "😊", stage: "personal", scheduledSession: "18/01 09:30", unreadMessages: 1, lastMessage: "I've been journaling daily as we discussed and it's helping.", lastNote: "Excellent progress with journaling exercises. Jessica is gaining insights into her thought patterns and emotional triggers. Ready to explore deeper trauma work in upcoming sessions." },
  { id: 12, name: "Robert Wilson", type: "Group", status: "Inactive", lastActive: "12/01 11:30", created: "15/11 14:45", mood: "😔", stage: "inactive", scheduledSession: null, unreadMessages: 0, lastMessage: "I appreciate all the support you've provided over the months.", lastNote: "Completed therapy program with positive outcomes. Successfully addressed depression and developed healthy lifestyle habits. Expressed gratitude for support received during difficult period." },
  { id: 13, name: "Sophie Anderson", type: "Personal", status: "Active", lastActive: "16/01 12:15", created: "06/01 11:00", mood: "😊", stage: "light", scheduledSession: "19/01 13:45", unreadMessages: 1, lastMessage: "I'm feeling more optimistic about therapy after our first session.", lastNote: "New client with mild anxiety symptoms. Very receptive to initial assessment. Plans to start with relaxation techniques and stress management strategies." },
  { id: 14, name: "Marcus Thompson", type: "Personal", status: "Active", lastActive: "16/01 08:30", created: "07/01 14:20", mood: "😐", stage: "light", scheduledSession: "20/01 16:00", unreadMessages: 0, lastMessage: "Looking forward to learning more coping strategies.", lastNote: "First-time therapy client dealing with work-related stress. Cautious but willing to engage. Needs gentle introduction to therapeutic process and trust-building." },
  { id: 15, name: "Rachel Green", type: "Group", status: "Active", lastActive: "15/01 19:45", created: "08/01 09:30", mood: "😊", stage: "light", scheduledSession: null, unreadMessages: 2, lastMessage: "The intake questionnaire really made me think about my goals.", lastNote: "Interested in group therapy for social anxiety. Completed comprehensive intake assessment. Good candidate for anxiety support group starting next month." },
  { id: 16, name: "Kevin Liu", type: "Personal", status: "Active", lastActive: "16/01 07:50", created: "09/01 16:45", mood: "😐", stage: "light", scheduledSession: "18/01 11:15", unreadMessages: 3, lastMessage: "I have questions about the therapy process and what to expect.", lastNote: "New client with perfectionism issues. Asking detailed questions about treatment approach. Needs clear explanation of therapy process to feel comfortable moving forward." },
  { id: 17, name: "Michelle Park", type: "Personal", status: "Active", lastActive: "16/01 13:25", created: "10/01 12:00", mood: "😊", stage: "light", scheduledSession: "21/01 10:30", unreadMessages: 1, lastMessage: "Thank you for being so welcoming during my first visit.", lastNote: "Very positive first impression of therapy. Dealing with life transitions and relationship changes. Eager to learn healthy communication and boundary-setting skills." }
];

export default function Clients() {
  const [filter, setFilter] = useState("status.active");  
  const [viewMode, setViewMode] = useState("funnel"); // "list" or "funnel"
  const [visibleColumns, setVisibleColumns] = useState({
    light: true,
    group: true,
    personal: true,
    completed: true,
    inactive: false
  });
  const [sortBy, setSortBy] = useState("activity"); // "activity", "name", "created", "unread", "session", "oldest", "type"
  const router = useRouter();

  const funnelStages = [
    { 
      id: "light", 
      name: "Light", 
      icon: UserPlus, 
      color: "bg-blue-500", 
      description: "Light"
    },
    { 
      id: "group", 
      name: "Group", 
      icon: CalendarCheck, 
      color: "bg-yellow-500", 
      description: "Group"
    },
    { 
      id: "personal", 
      name: "Personal", 
      icon: Trophy, 
      color: "bg-purple-500", 
      description: "Personal"
    },
    { 
      id: "completed", 
      name: "Completed", 
      icon: Trophy, 
      color: "bg-green-500", 
      description: "Completed"
    },
    { 
      id: "inactive", 
      name: "Inactive", 
      icon: UserX, 
      color: "bg-red-500", 
      description: "Inactive"
    }
  ];

  const filteredClients = clients.filter(client => {
    if (filter === "clients.all") return true;
    if (filter === "status.active") return client.status === "Active";
    if (filter === "status.inactive") return client.status === "Inactive";
    return true;
  });

  const sortedClients = [...filteredClients].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "created":
        return new Date(b.created).getTime() - new Date(a.created).getTime();
      case "unread":
        return b.unreadMessages - a.unreadMessages;
      case "session":
        if (!a.scheduledSession && !b.scheduledSession) return 0;
        if (!a.scheduledSession) return 1;
        if (!b.scheduledSession) return -1;
        return new Date(a.scheduledSession).getTime() - new Date(b.scheduledSession).getTime();
      case "oldest":
        return a.lastActive.localeCompare(b.lastActive);
      case "type":
        const typeOrder = { 'Personal': 0, 'Group': 1 };
        return (typeOrder[a.type] ?? 2) - (typeOrder[b.type] ?? 2);
      case "activity":
      default:
        return b.lastActive.localeCompare(a.lastActive);
    }
  });

  const getClientsByStage = (stageId) => {
    return sortedClients.filter(client => client.stage === stageId);
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'light': return 'bg-blue-100 text-blue-800';
      case 'group': return 'bg-yellow-100 text-yellow-800';
      case 'personal': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-accent text-accent-foreground';
    }
  };

  return (
    <TooltipProvider>
      <div className="page-container">
        {/* Page Header */}
        <PageHeader 
          title={"Clients"} 
          subtitle={"All Clients"}
        >
          {/* View Toggle */}
          <div className="flex rounded-lg border border-border bg-background p-1">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              {"List"}
            </Button>
            <Button
              variant={viewMode === "funnel" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("funnel")}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              {"Cards"}
            </Button>
          </div>
          <CreateClientDialog />
        </PageHeader>

      {/* Controls */}
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        {/* Column Visibility and Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              {"Filter and Columns"}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>{"Status"}</DropdownMenuLabel>
            <DropdownMenuCheckboxItem 
              checked={filter === "status.active"}
              onCheckedChange={() => setFilter("status.active")}
            >
              {"Active"}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem 
              checked={filter === "status.inactive"}
              onCheckedChange={() => setFilter("status.inactive")}
            >
                {"Inactive"}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem 
              checked={filter === "clients.all"}
              onCheckedChange={() => setFilter("clients.all")}
            >
              {"All"}
            </DropdownMenuCheckboxItem>
            
            {viewMode === "funnel" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{"Visible Columns"}</DropdownMenuLabel>
                {funnelStages.map((stage) => (
                  <DropdownMenuCheckboxItem
                    key={stage.id}
                    checked={visibleColumns[stage.id]}
                    onCheckedChange={() => setVisibleColumns(prev => ({ ...prev, [stage.id]: !prev[stage.id] }))}
                  >
                    {stage.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sorting Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              {"Sort By"}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>{"Sort By"}</DropdownMenuLabel>
            <DropdownMenuCheckboxItem 
              checked={sortBy === "activity"}
              onCheckedChange={() => setSortBy("activity")}
            >
              {"Latest Activity"}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem 
              checked={sortBy === "name"}
              onCheckedChange={() => setSortBy("name")}
            >
              {"Name A-Z"}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem 
              checked={sortBy === "created"}
              onCheckedChange={() => setSortBy("created")}
            >
              {"Created Date"}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem 
              checked={sortBy === "unread"}
              onCheckedChange={() => setSortBy("unread")}
            >
              {"Unread Messages"}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem 
              checked={sortBy === "session"}
              onCheckedChange={() => setSortBy("session")}
            >
              {"Next Session"}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem 
              checked={sortBy === "oldest"}
              onCheckedChange={() => setSortBy("oldest")}
            >
              {"Last Active"}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem 
              checked={sortBy === "type"}
              onCheckedChange={() => setSortBy("type")}
            >
              {"Type"}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Funnel View */}
      {viewMode === "funnel" && (
        <div className="space-y-6">
          {/* Funnel Columns */}
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Object.values(visibleColumns).filter(Boolean).length}, 1fr)` }}>
            {funnelStages.filter(stage => visibleColumns[stage.id]).map((stage) => {
              const stageClients = getClientsByStage(stage.id);
              return (
                <Card key={stage.id} className="card-standard flex flex-col h-[600px]">
                   <CardHeader className="pb-4 flex-shrink-0">
                     <CardTitle className="text-lg font-bold text-foreground flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className={`w-4 h-4 rounded-full ${stage.color}`} />
                         <span>{stage.name}</span>
                       </div>
                       <span className="text-2xl font-bold text-primary">{stageClients.length}</span>
                     </CardTitle>
                   </CardHeader>
                  <CardContent className="space-y-3 flex-1 overflow-y-auto">
                     {stageClients.map((client) => (
                       <div
                         key={client.id}
                         className="p-4 rounded-lg border border-border bg-background hover:bg-muted/50 cursor-pointer transition-colors h-[140px] flex flex-col"
                         onClick={() => router.push(`/coach/clients/${client.id}`)}
                       >
                         <div className="flex items-center gap-2 mb-3">
                           <Avatar className="h-8 w-8">
                             <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                               {client.name.split(' ').map(n => n[0]).join('')}
                             </AvatarFallback>
                           </Avatar>
                           <span className="font-medium text-sm text-foreground">{client.name}</span>
                           <span className="text-xl ml-auto">{client.mood}</span>
                         </div>
                          <div className="flex gap-1 mb-3 items-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-7 w-7 p-0 hover:bg-primary hover:text-primary-foreground relative"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/coach/clients/${client.id}`);
                                  }}
                                >
                                  <MessageCircle className="h-4 w-4" />
                                  {client.unreadMessages > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                      {client.unreadMessages}
                                    </span>
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  {client.lastMessage.split(' ').slice(0, 15).join(' ')}
                                  {client.lastMessage.split(' ').length > 15 && '...'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-7 w-7 p-0 hover:bg-accent hover:text-accent-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/coach/clients/${client.id}`);
                                  }}
                                >
                                  <StickyNote className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  {client.lastNote.split(' ').slice(0, 15).join(' ')}
                                  {client.lastNote.split(' ').length > 15 && '...'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                           </div>
                           <div className="mt-auto">
                             {client.scheduledSession && (
                               <div className="flex items-center gap-2 text-xs">
                                 <Calendar className="h-4 w-4 text-muted-foreground" />
                                 <span className="text-muted-foreground">
                                   {client.scheduledSession}
                                 </span>
                               </div>
                             )}
                           </div>
                      </div>
                    ))}
                    {stageClients.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        {"No clients in this stage"}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <Card className="shadow-soft border-border bg-card">
           <CardHeader>
             <CardTitle className="text-foreground flex items-center gap-2">
               <Users className="h-5 w-5 text-primary" />
               {"Client List"} ({sortedClients.length})
             </CardTitle>
           </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {/* Header Row */}
              <div className="grid grid-cols-8 gap-4 p-4 text-sm font-medium text-muted-foreground bg-muted/30 rounded-lg">
                <div>Name</div>
                <div>Type</div>
                <div>Status</div>
                <div>Mood</div>
                <div>Last Active</div>
                <div>Created</div>
                <div>Session</div>
                <div>Actions</div>
              </div>

              {/* Client Rows */}
              {sortedClients.map((client) => {
                const getStageDisplayName = (stage) => {
                  switch (stage) {
                    case 'light': return 'Light';
                    case 'group': return 'Group';
                    case 'personal': return 'Personal';
                    case 'completed': return 'Completed';
                    case 'inactive': return 'Inactive';
                    default: return stage;
                  }
                };
                
                return (
                  <div 
                    key={client.id} 
                    className="grid grid-cols-8 gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-border"
                    onClick={() => router.push(`/coach/clients/${client.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {client.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-foreground font-medium">{client.name}</span>
                    </div>
                    <div>
                      <Badge className={`${getStageColor(client.stage)} border-0 font-medium`}>
                        {getStageDisplayName(client.stage)}
                      </Badge>
                    </div>
                    <div>
                      <Badge 
                        className={`${client.status === 'Active' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {client.status}
                      </Badge>
                    </div>
                    <div className="text-2xl">{client.mood}</div>
                    <div className="text-sm text-foreground">{client.lastActive}</div>
                    <div className="text-sm text-muted-foreground">{client.created}</div>
                    <div className="text-sm text-muted-foreground">
                      {client.scheduledSession || "No Session"}
                    </div>
                    <div className="flex gap-2 items-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground relative"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/coach/clients/${client.id}`);
                            }}
                          >
                            <MessageCircle className="h-4 w-4" />
                            {client.unreadMessages > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                {client.unreadMessages}
                              </span>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            {client.lastMessage.split(' ').slice(0, 15).join(' ')}
                            {client.lastMessage.split(' ').length > 15 && '...'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/coach/clients/${client.id}`);
                            }}
                          >
                            <StickyNote className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            {client.lastNote.split(' ').slice(0, 15).join(' ')}
                            {client.lastNote.split(' ').length > 15 && '...'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 hover:bg-secondary hover:text-secondary-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/coach/clients/${client.id}`);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </TooltipProvider>
  );
}