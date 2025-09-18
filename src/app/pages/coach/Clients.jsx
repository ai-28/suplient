"use client"

import { useState, useEffect } from "react";
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

// Real data will be fetched from API and stored in clients state

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch clients data from API
  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clients');
      const data = await response.json();
      
      if (data.status) {
        setClients(data.clients || []);
      } else {
        console.error('Failed to fetch clients:', data.message);
        setClients([]);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Handle client creation callback
  const handleClientCreated = (newClient) => {
    console.log('New client created:', newClient);
    // Refresh the clients list
    fetchClients();
  };
console.log("clients",clients)
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

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading clients...</p>
          </div>
        </div>
      </div>
    );
  }

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
          <CreateClientDialog onClientCreated={handleClientCreated} />
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