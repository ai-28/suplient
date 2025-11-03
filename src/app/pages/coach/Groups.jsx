"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useGroups } from "@/app/hooks/useGroups";
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
import { useTranslation } from "@/app/context/LanguageContext";

// Default icons for group stages
const defaultGroupIcons = {
  upcoming: Clock,
  ongoing: PlayCircle,
  completed: CheckCircle,
  inactive: PauseCircle
};

export default function Groups() {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslation();
  const { groups, loading, error, refetchGroups, updateGroupStage } = useGroups();
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedGroupForSettings, setSelectedGroupForSettings] = useState(null);
  const [viewMode, setViewMode] = useState('cards');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterBy, setFilterBy] = useState('all');
  const [groupPipelineStages, setGroupPipelineStages] = useState([]);
  const [visibleStages, setVisibleStages] = useState({});

  // Fetch pipeline stages from database
  useEffect(() => {
    const fetchPipelineStages = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch('/api/pipeline/group');
        const data = await response.json();
        
        if (data.success && data.stages && data.stages.length > 0) {
          // Map stages with default icons
          const stagesWithIcons = data.stages.map(stage => ({
            ...stage,
            icon: defaultGroupIcons[stage.id] || Clock
          }));
          setGroupPipelineStages(stagesWithIcons);

          // Update visible stages based on isVisible property
          const visibilityMap = {};
          data.stages.forEach(stage => {
            visibilityMap[stage.id] = stage.isVisible !== undefined ? stage.isVisible : true;
          });
          setVisibleStages(visibilityMap);
        }
      } catch (error) {
        console.error('Error fetching group pipeline stages:', error);
      }
    };

    fetchPipelineStages();
  }, [session?.user?.id]);

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

  const handleStageMove = async (groupId, newStage) => {
    try {
      console.log(`Moving group ${groupId} to stage ${newStage}`);
      await updateGroupStage(groupId, newStage);
    } catch (error) {
      console.error('Error updating group stage:', error);
      // You could add a toast notification here to show the error to the user
    }
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
                  {group.lastComment ? (
                    <>
                      {group.lastComment.split(' ').slice(0, 15).join(' ')}
                      {group.lastComment.split(' ').length > 15 && '...'}
                    </>
                  ) : (
                    'No recent messages'
                  )}
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
                  {group.lastComment ? (
                    <>
                      {group.lastComment.split(' ').slice(0, 15).join(' ')}
                      {group.lastComment.split(' ').length > 15 && '...'}
                    </>
                  ) : (
                    'No recent messages'
                  )}
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
        title={t('navigation.groups')} 
        subtitle={t('groups.title')}
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
          className="bg-gradient-primary text-[#1A2D4D] shadow-medium hover:shadow-strong transition-all"
          onClick={() => setCreateGroupOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Group
        </Button>
      </PageHeader>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading groups...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-destructive mb-4">Error loading groups: {error}</p>
            <Button onClick={refetchGroups} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && groups.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Users2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
            <p className="text-muted-foreground mb-4">Create your first group to get started</p>
            <Button onClick={() => setCreateGroupOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && groups.length > 0 && (
        <>
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
        </>
      )}

      <CreateGroupDialog 
        open={createGroupOpen} 
        onOpenChange={setCreateGroupOpen}
        onGroupCreated={refetchGroups}
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
