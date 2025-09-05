import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Badge } from "@/app/components/ui/badge";
import { Switch } from "@/app/components/ui/switch";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Shield,
  Bell,
  Target,
  TrendingUp,
  Users,
  Clock,
  UserPlus,
  MessageCircle,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  TrendingDown
} from "lucide-react";
import { useState } from "react";
import { useGoalTracking } from "@/app/hooks/useGoalTracking";
import { toast } from "sonner";

export default function ClientProfile() {
  const { 
    goals, 
    badHabits, 
    toggleGoal, 
    toggleBadHabit, 
    addCustomGoal, 
    removeCustomGoal,
    addCustomBadHabit,
    removeCustomBadHabit,
    calculateOverallScore
  } = useGoalTracking();

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    profilePictureVisible: true,
    nameFormat: 'full', // 'full' or 'firstInitial'
    onlineStatusVisible: true
  });

  // Mock user data
  const userData = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+1 (555) 123-4567"
  };

  // Format name based on privacy setting
  const getDisplayName = () => {
    if (privacySettings.nameFormat === 'firstInitial') {
      return `${userData.firstName} ${userData.lastName.charAt(0)}.`;
    }
    return `${userData.firstName} ${userData.lastName}`;
  };

  const [showCustomGoalDialog, setShowCustomGoalDialog] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalDescription, setNewGoalDescription] = useState("");
  
  const [showCustomBadHabitDialog, setShowCustomBadHabitDialog] = useState(false);
  const [newBadHabitName, setNewBadHabitName] = useState("");
  const [newBadHabitDescription, setNewBadHabitDescription] = useState("");

  const handleAddCustomGoal = () => {
    if (!newGoalName.trim()) {
      toast.error("Please enter a goal name");
      return;
    }
    
    addCustomGoal(newGoalName.trim(), newGoalDescription.trim());
    setNewGoalName("");
    setNewGoalDescription("");
    setShowCustomGoalDialog(false);
    toast.success("Custom goal added successfully!");
  };

  const handleAddCustomBadHabit = () => {
    if (!newBadHabitName.trim()) {
      toast.error("Please enter a habit name");
      return;
    }
    
    addCustomBadHabit(newBadHabitName.trim(), newBadHabitDescription.trim());
    setNewBadHabitName("");
    setNewBadHabitDescription("");
    setShowCustomBadHabitDialog(false);
    toast.success("Custom habit added successfully!");
  };

  const handleToggleGoal = (goalId) => {
    toggleGoal(goalId);
    toast.success("Goal updated successfully!");
  };

  const handleToggleBadHabit = (habitId) => {
    toggleBadHabit(habitId);
    toast.success("Habit tracking updated!");
  };

  const handleRemoveCustomGoal = (goalId, goalName) => {
    removeCustomGoal(goalId);
    toast.success(`"${goalName}" removed successfully!`);
  };

  const handleRemoveCustomBadHabit = (habitId, habitName) => {
    removeCustomBadHabit(habitId);
    toast.success(`"${habitName}" removed successfully!`);
  };

  // Single assigned therapist (simplified from multiple)
  const assignedTherapist = {
    name: "Dr. Sarah Johnson", 
    specialization: "Anxiety & Depression", 
    since: "Jan 2024",
    email: "sarah.johnson@clinic.com",
    phone: "+1 (555) 123-4567"
  };

  // Single current group (simplified from multiple)
  const currentGroup = {
    id: 1,
    name: "Anxiety Support Circle",
    description: "A supportive space for managing anxiety together",
    members: 8,
    maxMembers: 12,
    joinedDate: "Feb 2024",
    nextSession: "Today, 3:00 PM",
    sessionFrequency: "Weekly",
    status: "Active",
    attendance: 85
  };

  // Available groups the client can join
  const availableGroups = [
    {
      id: 3,
      name: "Sleep Recovery Workshop",
      description: "Learn techniques and strategies for better sleep patterns",
      members: 7,
      maxMembers: 15,
      sessionFrequency: "Bi-weekly",
      nextSession: "Next Monday, 7:00 PM",
      duration: "8 weeks",
      seatsLeft: 8
    },
    {
      id: 4,
      name: "Stress Management Collective",
      description: "Collaborative approach to identifying and managing stress triggers",
      members: 11,
      maxMembers: 15,
      sessionFrequency: "Weekly",
      nextSession: "Next Thursday, 6:00 PM",
      duration: "12 weeks",
      seatsLeft: 4
    },
    {
      id: 5,
      name: "Mindful Eating Circle",
      description: "Develop a healthy relationship with food through mindfulness",
      members: 5,
      maxMembers: 10,
      sessionFrequency: "Weekly",
      nextSession: "Next Wednesday, 5:30 PM",
      duration: "6 weeks",
      seatsLeft: 5
    }
  ];

  const handleJoinRequest = (groupId, groupName) => {
    // Handle join request logic here
    alert(`Join request sent for ${groupName}!`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and preferences.
        </p>
      </div>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className={`w-full ${isMobile ? 'grid grid-cols-2 gap-2 h-auto p-2' : 'grid grid-cols-4'}`}>
          <TabsTrigger 
            value="personal" 
            className={`${isMobile ? 'h-12 text-xs px-2' : 'flex-1'}`}
          >
            <div className="flex flex-col items-center gap-1">
              <User className="h-4 w-4" />
              <span>{isMobile ? "Profile" : "Personal Info"}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="goals" 
            className={`${isMobile ? 'h-12 text-xs px-2' : 'flex-1'}`}
          >
            <div className="flex flex-col items-center gap-1">
              <Target className="h-4 w-4" />
              <span>{isMobile ? "Goals" : "Goals & Progress"}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="group" 
            className={`${isMobile ? 'h-12 text-xs px-2' : 'flex-1'}`}
          >
            <div className="flex flex-col items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{isMobile ? "Group" : "My Group"}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className={`${isMobile ? 'h-12 text-xs px-2' : 'flex-1'}`}
          >
            <div className="flex flex-col items-center gap-1">
              <Shield className="h-4 w-4" />
              <span>Settings</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-3'}`}>
            {/* Profile Picture */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <Avatar className="h-24 w-24 mx-auto">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    JD
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm">
                  Change Photo
                </Button>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <div className={isMobile ? '' : 'md:col-span-2'}>
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" defaultValue="John" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" defaultValue="Doe" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="john@example.com" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="birthdate">Date of Birth</Label>
                    <Input id="birthdate" type="date" defaultValue="1990-01-01" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">About Me</Label>
                    <Textarea 
                      id="bio" 
                      placeholder="Tell us a bit about yourself..."
                      defaultValue="I'm working on improving my mental health and building better habits."
                    />
                  </div>
                  
                  <Button>Save Changes</Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Assigned Therapist Section - Integrated into Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                My Therapist
              </CardTitle>
              <CardDescription>Your assigned mental health professional (full access)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {assignedTherapist.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{assignedTherapist.name}</h3>
                    <p className="text-sm text-muted-foreground">{assignedTherapist.specialization}</p>
                    <p className="text-xs text-muted-foreground">Working together since {assignedTherapist.since}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Contact
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          {/* Overall Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Progress</CardTitle>
              <CardDescription>Your current goal achievement level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="text-4xl font-bold text-primary">
                  {calculateOverallScore()}%
                </div>
                <p className="text-muted-foreground">
                  Based on {goals.filter(g => g.isActive).length} active goals
                </p>
                <div className="w-full bg-secondary rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-500"
                    style={{ width: `${calculateOverallScore()}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Life Area Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Life Area Goals
                </div>
                <Badge variant="outline">
                  {goals.filter(g => g.isActive).length} / {goals.length} active
                </Badge>
              </CardTitle>
              <CardDescription>
                Activate goals you want to track daily
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div key={goal.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-2xl">{goal.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{goal.name}</h3>
                          {goal.category === 'custom' && (
                            <Badge variant="secondary" className="text-xs">Custom</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {goal.description}
                        </p>
                        {goal.isActive && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>Current: {goal.currentScore}/5</span>
                              <div className="w-16 bg-secondary rounded-full h-1">
                                <div 
                                  className="h-1 rounded-full transition-all"
                                  style={{ 
                                    width: `${(goal.currentScore / 5) * 100}%`,
                                    backgroundColor: goal.color
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {goal.category === 'custom' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCustomGoal(goal.id, goal.name)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Switch
                        checked={goal.isActive}
                        onCheckedChange={() => handleToggleGoal(goal.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Add Custom Goal Button */}
              <div className="mt-4 pt-4 border-t">
                {!showCustomGoalDialog ? (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCustomGoalDialog(true)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Goal
                  </Button>
                ) : (
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
                    <div className="space-y-2">
                      <Label>Goal Name</Label>
                      <Input
                        placeholder="e.g., Learn a new skill"
                        value={newGoalName}
                        onChange={(e) => setNewGoalName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Describe what this goal means to you..."
                        value={newGoalDescription}
                        onChange={(e) => setNewGoalDescription(e.target.value)}
                        className="min-h-20"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddCustomGoal} size="sm">
                        Add Goal
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowCustomGoalDialog(false);
                          setNewGoalName("");
                          setNewGoalDescription("");
                        }}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bad Habits Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                  Habits to Reduce
                </div>
                <Badge variant="outline">
                  {badHabits.filter(h => h.isActive).length} / {badHabits.length} tracking
                </Badge>
              </CardTitle>
              <CardDescription>
                Select habits you want to track and reduce
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {badHabits.map((habit) => (
                  <div key={habit.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-2xl">{habit.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{habit.name}</h3>
                          {habit.category === 'custom' && (
                            <Badge variant="secondary" className="text-xs">Custom</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {habit.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {habit.category === 'custom' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCustomBadHabit(habit.id, habit.name)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Switch
                        checked={habit.isActive}
                        onCheckedChange={() => handleToggleBadHabit(habit.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Add Custom Bad Habit Button */}
              <div className="mt-4 pt-4 border-t">
                {!showCustomBadHabitDialog ? (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCustomBadHabitDialog(true)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Habit to Reduce
                  </Button>
                ) : (
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
                    <div className="space-y-2">
                      <Label>Habit Name</Label>
                      <Input
                        placeholder="e.g., Excessive screen time"
                        value={newBadHabitName}
                        onChange={(e) => setNewBadHabitName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Describe the habit you want to reduce..."
                        value={newBadHabitDescription}
                        onChange={(e) => setNewBadHabitDescription(e.target.value)}
                        className="min-h-20"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddCustomBadHabit} size="sm">
                        Add Habit
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowCustomBadHabitDialog(false);
                          setNewBadHabitName("");
                          setNewBadHabitDescription("");
                        }}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="group" className="space-y-4">
          {/* Current Group Section - Single Group */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                My Group
              </CardTitle>
              <CardDescription>Support group you're currently participating in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className={`flex ${isMobile ? 'flex-col' : 'items-start justify-between'} mb-3`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{currentGroup.name}</h3>
                      <Badge variant="default">{currentGroup.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{currentGroup.description}</p>
                    <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-wrap gap-4'} text-xs text-muted-foreground`}>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Joined {currentGroup.joinedDate}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{currentGroup.sessionFrequency}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{currentGroup.members}/{currentGroup.maxMembers} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>{currentGroup.attendance}% attendance</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'}`}>
                  <div className="text-sm">
                    <span className="font-medium">Next session: </span>
                    <span className="text-muted-foreground">{currentGroup.nextSession}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View Group
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Chat
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Groups Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Available Groups ({availableGroups.length})
              </CardTitle>
              <CardDescription>Join new support groups that match your interests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availableGroups.map((group) => (
                  <div key={group.id} className="p-4 border rounded-lg">
                     <div className={`flex ${isMobile ? 'flex-col' : 'items-start justify-between'} mb-3`}>
                       <div className="flex-1">
                         <h3 className="font-medium mb-1">{group.name}</h3>
                         <p className="text-sm text-muted-foreground mb-2">{group.description}</p>
                         <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-wrap gap-4'} text-xs text-muted-foreground`}>
                           <div className="flex items-center gap-1">
                             <Clock className="h-3 w-3" />
                             <span>{group.sessionFrequency} • {group.duration}</span>
                           </div>
                           <div className="flex items-center gap-1">
                             <Users className="h-3 w-3" />
                             <span>{group.seatsLeft} seats left</span>
                           </div>
                           <div className="flex items-center gap-1">
                             <Calendar className="h-3 w-3" />
                             <span>Starts {group.nextSession}</span>
                           </div>
                         </div>
                       </div>
                       {!isMobile && (
                         <div className="ml-4">
                           <Badge variant="secondary" className="mb-2">
                             {group.seatsLeft} seats left
                           </Badge>
                         </div>
                       )}
                     </div>
                     <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'}`}>
                       <div className="text-sm text-muted-foreground">
                         {group.members}/{group.maxMembers} members
                         {isMobile && (
                           <Badge variant="secondary" className="ml-2">
                             {group.seatsLeft} seats left
                           </Badge>
                         )}
                       </div>
                       <Button 
                         onClick={() => handleJoinRequest(group.id, group.name)}
                         className="flex items-center gap-2"
                         size="sm"
                       >
                         <UserPlus className="h-4 w-4" />
                         Request to Join
                       </Button>
                     </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Group Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Group Member Visibility
                </CardTitle>
                <CardDescription>Control what other group members can see</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Profile Picture</Label>
                    <p className="text-sm text-muted-foreground">
                      Show your profile picture to group members
                    </p>
                  </div>
                  <Switch 
                    checked={privacySettings.profilePictureVisible}
                    onCheckedChange={(checked) => 
                      setPrivacySettings(prev => ({ ...prev, profilePictureVisible: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Name Format</Label>
                    <p className="text-sm text-muted-foreground">
                      {privacySettings.nameFormat === 'full' ? 'Show full name' : 'Show first name + last initial'}
                    </p>
                  </div>
                  <Switch 
                    checked={privacySettings.nameFormat === 'full'}
                    onCheckedChange={(checked) => 
                      setPrivacySettings(prev => ({ ...prev, nameFormat: checked ? 'full' : 'firstInitial' }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Online Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Show when you're online in group chats
                    </p>
                  </div>
                  <Switch 
                    checked={privacySettings.onlineStatusVisible}
                    onCheckedChange={(checked) => 
                      setPrivacySettings(prev => ({ ...prev, onlineStatusVisible: checked }))
                    }
                  />
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    <Shield className="h-3 w-3 inline mr-1" />
                    Your coach/therapist always has full access to your profile and progress
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>Choose what notifications you receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Session Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminded about upcoming sessions
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Goal Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications about goal progress
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Group Messages</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications for new group messages
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Resources</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about new helpful resources
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
