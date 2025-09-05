"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { PageHeader } from "@/app/components/PageHeader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/app/components/ui/dropdown-menu";
import { CreateGroupDialog } from "@/app/components/CreateGroupDialog";
import { ScheduleSessionDialog } from "@/app/components/ScheduleSessionDialog";
import { GroupSettingsDialog } from "@/app/components/GroupSettingsDialog";
import { 
  Users2, 
  UserPlus, 
  Calendar,
  Settings,
  MessageCircle,
  LayoutGrid,
  List,
  ArrowUpDown,
  Filter,
  ChevronDown,
  Clock,
  PlayCircle,
  CheckCircle,
  PauseCircle,
  MoreVertical,
  Plus,
  StickyNote
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";

const groupPipelineStages = [
  { 
    id: "upcoming", 
    color: "bg-blue-500", 
    icon: Clock,
  },
  { 
    id: "ongoing", 
    color: "bg-green-500", 
    icon: PlayCircle,
  },
  { 
    id: "completed", 
    color: "bg-purple-500", 
    icon: CheckCircle,
  },
  { 
    id: "inactive", 
    color: "bg-gray-500", 
    icon: PauseCircle,
  }
];

const groups = [
  { 
    id: 1, 
    name: "Anxiety Support Circle", 
    members: 8, 
    nextSession: "01/06 14:30",
    avatars: ["AS", "JD", "MR", "LK", "TS"],
    stage: "ongoing",
    description: "Weekly anxiety support sessions",
    startDate: "March 2024",
    unreadMessages: 3,
    lastComment: "I've been feeling much better lately thanks to the breathing exercises we practiced last week."
  },
  { 
    id: 2, 
    name: "Depression Recovery", 
    members: 6, 
    nextSession: "15/06 16:00",
    avatars: ["DR", "KM", "RT", "TC", "CM"],
    stage: "ongoing",
    description: "Bi-weekly depression recovery group",
    startDate: "February 2024",
    unreadMessages: 7,
    lastComment: "The journaling activity really helped me understand my thought patterns better."
  },
  { 
    id: 3, 
    name: "Mindfulness Meditation", 
    members: 10, 
    nextSession: "30/06 10:00",
    avatars: ["MM", "SW", "BL", "ED", "CW"],
    stage: "upcoming",
    description: "Starting meditation group",
    startDate: "July 2024",
    unreadMessages: 0,
    lastComment: "Looking forward to starting our journey together next week."
  },
  { 
    id: 4, 
    name: "Stress Management", 
    members: 12, 
    nextSession: "Completed",
    avatars: ["SM", "JB", "AR", "MT", "NW"],
    stage: "completed",
    description: "8-week stress management program",
    startDate: "January 2024",
    unreadMessages: 0,
    lastComment: "Thank you all for making this journey so meaningful and transformative."
  },
  { 
    id: 5, 
    name: "Teen Support Group", 
    members: 5, 
    nextSession: "On Hold",
    avatars: ["TS", "PJ", "LG", "DL"],
    stage: "inactive",
    description: "Teen mental health support",
    startDate: "April 2024",
    unreadMessages: 0,
    lastComment: "We'll resume sessions when everyone is ready to participate again."
  },
  { 
    id: 6, 
    name: "Trauma Recovery", 
    members: 7, 
    nextSession: "05/07 11:15",
    avatars: ["TR", "MK", "RL", "TF", "CN"],
    stage: "upcoming",
    description: "Trauma-informed recovery group",
    startDate: "July 2024",
    unreadMessages: 1,
    lastComment: "Excited to begin this important work in a safe and supportive environment."
  }
];

export default function Groups() {
  const router = useRouter();
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedGroupForSettings, setSelectedGroupForSettings] = useState(null);
  const [viewMode, setViewMode] = useState('cards');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterBy, setFilterBy] = useState('all');
  const [visibleStages, setVisibleStages] = useState({
    upcoming: true,
    ongoing: true,
    completed: true,
    inactive: true
  });

  const handleScheduleClick = (group) => {
    setSelectedGroup(group);
    setScheduleDialogOpen(true);
  };

  const handleGroupClick = (groupId) => {
    router.push(`/coach/group/${groupId}`);
  };

  const handleSettingsClick = (group) => {
    setSelectedGroupForSettings(group);
    setGroupSettingsOpen(true);
  };

  const handleStageMove = (groupId, newStage) => {
    console.log(`Moving group ${groupId} to stage ${newStage}`);
    // Handle stage transition logic
  };

  const filteredAndSortedGroups = groups
    .filter(group => {
      if (filterBy === 'all') return true;
      if (filterBy === 'active') return ['upcoming', 'ongoing'].includes(group.stage);
      if (filterBy === 'inactive') return ['completed', 'inactive'].includes(group.stage);
      return group.stage === filterBy;
    })
    .sort((a, b) => {
      let aValue;
      let bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'members':
          aValue = a.members;
          bValue = b.members;
          break;
        case 'nextSession':
          aValue = new Date(a.nextSession === 'Completed' || a.nextSession === 'On Hold' ? '1900-01-01' : a.nextSession + ' 2024').getTime();
          bValue = new Date(b.nextSession === 'Completed' || b.nextSession === 'On Hold' ? '1900-01-01' : b.nextSession + ' 2024').getTime();
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const getStageGroups = (stageId) => {
    return filteredAndSortedGroups.filter(group => group.stage === stageId);
  };

  const getStageStats = (stageId) => {
    const stageGroups = groups.filter(group => group.stage === stageId);
    return {
      count: stageGroups.length,
      totalMembers: stageGroups.reduce((sum, group) => sum + group.members, 0)
    };
  };

  const renderGroupCard = (group) => {
    const stage = groupPipelineStages.find(s => s.id === group.stage);
    const StageIcon = stage?.icon || Clock;

    return (
      <Card 
        key={group.id} 
        className="group card-hover cursor-pointer bg-background h-[140px] flex flex-col"
        onClick={() => handleGroupClick(group.id)}
      >
        <CardContent className="p-3 flex-1 min-h-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-foreground pr-2 line-clamp-2 leading-tight">{group.name}</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuLabel className="text-xs">Move To Stage</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {groupPipelineStages.map((stageOption) => (
                      <DropdownMenuItem
                        key={stageOption.id}
                        className="text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStageMove(group.id, stageOption.id);
                        }}
                        disabled={stageOption.id === group.stage}
                      >
                        <stageOption.icon className="h-3 w-3 mr-2" />
                        {stageOption.id}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSettingsClick(group);
                      }}
                    >
                      <Settings className="h-3 w-3 mr-2" />
                      Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <div className="flex gap-1 items-center mb-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 w-7 p-0 hover:bg-primary hover:text-primary-foreground relative"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/coach/group/${group.id}`);
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  {group.unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {group.unreadMessages}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {group.lastComment.split(' ').slice(0, 15).join(' ')}
                  {group.lastComment.split(' ').length > 15 && '...'}
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
                    router.push(`/coach/group/${group.id}`);
                  }}
                >
                  <StickyNote className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {group.lastComment.split(' ').slice(0, 15).join(' ')}
                  {group.lastComment.split(' ').length > 15 && '...'}
                </p>
              </TooltipContent>
            </Tooltip>
            <div className="flex items-center gap-1 ml-2">
              <Users2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{group.members}</span>
            </div>
          </div>
          <div className="mt-auto">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{group.nextSession}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader 
        title={"Groups"} 
        subtitle={"Manage your groups"}
      >
        {/* View Toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8 px-3"
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="h-8 px-3"
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            Cards
          </Button>
        </div>
        
        <Button 
          className="bg-gradient-primary text-white shadow-medium hover:shadow-strong transition-all"
          onClick={() => setCreateGroupOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Group
        </Button>
      </PageHeader>

      {/* Controls */}
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        {/* Filter & Columns Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter and Columns
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Filter Groups</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={filterBy === 'all'}
              onCheckedChange={() => setFilterBy('all')}
            >
              Show All
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filterBy === 'active'}
              onCheckedChange={() => setFilterBy('active')}
            >
              Active
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filterBy === 'inactive'}
              onCheckedChange={() => setFilterBy('inactive')}
            >
              Inactive
            </DropdownMenuCheckboxItem>
            {viewMode === 'cards' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Show Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {groupPipelineStages.map((stage) => (
                  <DropdownMenuCheckboxItem
                    key={`column-${stage.id}`}
                    checked={visibleStages[stage.id]}
                    onCheckedChange={(checked) => 
                      setVisibleStages(prev => ({ ...prev, [stage.id]: checked }))
                    }
                  >
                    <stage.icon className="h-4 w-4 mr-2" />
                    {stage.id}
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
              Sort By
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={sortBy === 'name'}
              onCheckedChange={() => setSortBy('name')}
            >
              Sort By Name
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sortBy === 'members'}
              onCheckedChange={() => setSortBy('members')}
            >
              Sort By Members
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sortBy === 'nextSession'}
              onCheckedChange={() => setSortBy('nextSession')}
            >
              Sort By Next Session
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
              {sortOrder === 'asc' ? "Descending" : "Ascending"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Groups Display */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {groupPipelineStages
            .filter(stage => visibleStages[stage.id])
            .map((stage) => {
              const stageGroups = getStageGroups(stage.id);
              const stats = getStageStats(stage.id);
              const StageIcon = stage.icon;

              return (
                <Card key={stage.id} className="shadow-soft border-border bg-card flex flex-col h-[600px]">
                  <CardHeader className="pb-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StageIcon className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg font-bold text-foreground">{stage.id}</CardTitle>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {stats.count}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 pt-0 pb-4">
                    <ScrollArea className="h-full">
                      <div className="space-y-3">
                        {stageGroups.map((group) => renderGroupCard(group))}
                        {stageGroups.length === 0 && (
                          <div className="text-center py-12 text-muted-foreground text-sm">
                            No Groups In Stage
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Next Session</TableHead>
                <TableHead className="w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedGroups.map((group) => {
                const stage = groupPipelineStages.find(s => s.id === group.stage);
                const StageIcon = stage?.icon || Clock;

                return (
                  <TableRow 
                    key={group.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleGroupClick(group.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Users2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">{group.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{group.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${stage?.color} text-white border-none text-xs`}>
                        <StageIcon className="h-3 w-3 mr-1" />
                          {stage?.id}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          {group.avatars.slice(0, 3).map((initial, index) => (
                            <Avatar key={index} className="h-5 w-5 border border-background">
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {initial}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {group.members > 3 && (
                            <div className="h-5 w-5 rounded-full bg-muted border border-background flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">
                                +{group.members - 3}
                              </span>
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {group.members}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {group.nextSession}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleScheduleClick({ name: group.name, members: group.members });
                          }}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          Schedule
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/coach/group/${group.id}`);
                          }}
                        >
                          <MessageCircle className="h-3 w-3" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 px-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Move To Stage</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {groupPipelineStages.map((stageOption) => (
                              <DropdownMenuItem
                                key={stageOption.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStageMove(group.id, stageOption.id);
                                }}
                                disabled={stageOption.id === group.stage}
                              >
                                <stageOption.icon className="h-4 w-4 mr-2" />
                                {stageOption.id}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleSettingsClick(group);
                            }}>
                              <Settings className="h-4 w-4 mr-2" />
                              Settings
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Dialogs */}
      <CreateGroupDialog 
        open={createGroupOpen} 
        onOpenChange={setCreateGroupOpen} 
      />
      
      {selectedGroup && (
        <ScheduleSessionDialog
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          groupName={selectedGroup.name}
          groupMembers={selectedGroup.members}
        />
      )}

      <GroupSettingsDialog
        open={groupSettingsOpen}
        onOpenChange={setGroupSettingsOpen}
        group={selectedGroupForSettings}
      />

    </div>
  );
}
