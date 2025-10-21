"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Badge } from "@/app/components/ui/badge";
import { Switch } from "@/app/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
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
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useGroups } from "@/app/hooks/useGroups";

// Demo data for goals and habits
const demoGoals = [
  {
    id: 1,
    name: "Exercise Regularly",
    description: "Work out at least 3 times per week",
    isActive: true,
    isCustom: false,
    category: "health",
    targetValue: 3,
    currentValue: 2,
    unit: "times per week",
    progress: 67
  },
  {
    id: 2,
    name: "Meditate Daily",
    description: "Practice mindfulness meditation for 10 minutes daily",
    isActive: true,
    isCustom: false,
    category: "mindfulness",
    targetValue: 7,
    currentValue: 5,
    unit: "days per week",
    progress: 71
  },
  {
    id: 3,
    name: "Read Books",
    description: "Read for at least 30 minutes every day",
    isActive: false,
    isCustom: true,
    category: "learning",
    targetValue: 7,
    currentValue: 4,
    unit: "days per week",
    progress: 57
  },
  {
    id: 4,
    name: "Drink More Water",
    description: "Drink at least 8 glasses of water daily",
    isActive: true,
    isCustom: true,
    category: "health",
    targetValue: 8,
    currentValue: 6,
    unit: "glasses per day",
    progress: 75
  }
];

const demoBadHabits = [
  {
    id: 1,
    name: "Smoking",
    description: "Reduce cigarette consumption",
    isActive: true,
    isCustom: false,
    category: "health",
    targetValue: 0,
    currentValue: 2,
    unit: "cigarettes per day",
    progress: 80 // 80% reduction
  },
  {
    id: 2,
    name: "Late Night Snacking",
    description: "Avoid eating after 9 PM",
    isActive: true,
    isCustom: true,
    category: "health",
    targetValue: 0,
    currentValue: 3,
    unit: "nights per week",
    progress: 57 // 57% reduction
  },
  {
    id: 3,
    name: "Excessive Screen Time",
    description: "Limit phone usage to 2 hours per day",
    isActive: false,
    isCustom: true,
    category: "productivity",
    targetValue: 2,
    currentValue: 4,
    unit: "hours per day",
    progress: 50
  }
];

// Custom hook for goal tracking
const useGoalTracking = () => {
  const [goals, setGoals] = useState([]);
  const [badHabits, setBadHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch goals data from API
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/client/goals');
        const data = await response.json();

        if (data.success) {
          setGoals(data.goals);
          setBadHabits(data.badHabits);
        } else {
          setError('Failed to load goals data');
          // Fallback to demo data
          setGoals(demoGoals);
          setBadHabits(demoBadHabits);
        }
      } catch (err) {
        console.error('Error fetching goals:', err);
        setError('Failed to load goals data');
        // Fallback to demo data
        setGoals(demoGoals);
        setBadHabits(demoBadHabits);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, []);

  const toggleGoal = (goalId) => {
    setGoals(prev => prev.map(goal => 
      goal.id === goalId 
        ? { ...goal, isActive: !goal.isActive }
        : goal
    ));
  };

  const toggleBadHabit = (habitId) => {
    setBadHabits(prev => prev.map(habit => 
      habit.id === habitId 
        ? { ...habit, isActive: !habit.isActive }
        : habit
    ));
  };

  const addCustomGoal = (name, description) => {
    const newGoal = {
      id: Date.now(),
      name,
      description,
      isActive: true,
      isCustom: true,
      category: "custom",
      targetValue: 1,
      currentValue: 0,
      unit: "times per week",
      progress: 0
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const removeCustomGoal = (goalId) => {
    setGoals(prev => prev.filter(goal => goal.id !== goalId));
  };

  const addCustomBadHabit = (name, description) => {
    const newHabit = {
      id: Date.now(),
      name,
      description,
      isActive: true,
      isCustom: true,
      category: "custom",
      targetValue: 0,
      currentValue: 1,
      unit: "times per week",
      progress: 0
    };
    setBadHabits(prev => [...prev, newHabit]);
  };

  const removeCustomBadHabit = (habitId) => {
    setBadHabits(prev => prev.filter(habit => habit.id !== habitId));
  };

  const calculateOverallScore = () => {
    const activeGoals = goals.filter(goal => goal.isActive);
    if (activeGoals.length === 0) return 0;
    
    const totalScore = activeGoals.reduce((sum, goal) => sum + (goal.currentScore || 0), 0);
    return Math.round((totalScore / (activeGoals.length * 5)) * 100);
  };

  return {
    goals,
    badHabits,
    toggleGoal,
    toggleBadHabit,
    addCustomGoal,
    removeCustomGoal,
    addCustomBadHabit,
    removeCustomBadHabit,
    calculateOverallScore,
    loading,
    error
  };
};

export default function ClientProfile() {
  const { data: session } = useSession();
  const router = useRouter();
  const { 
    goals, 
    badHabits, 
    toggleGoal, 
    toggleBadHabit, 
    addCustomGoal, 
    removeCustomGoal,
    addCustomBadHabit,
    removeCustomBadHabit,
    calculateOverallScore,
    loading: goalsLoading,
    error: goalsError
  } = useGoalTracking();

  // Get real groups data
  const { groups, loading: groupsLoading, error: groupsError } = useGroups();

  // User data state
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    birthdate: "",
    bio: ""
  });

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    profilePictureVisible: true,
    nameFormat: 'full', // 'full' or 'firstInitial'
    onlineStatusVisible: true
  });

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/user/profile');
        const data = await response.json();

        if (data.success && data.user) {
          console.log('User data loaded:', data.user);
          console.log('Coach data:', {
            coachId: data.user.coachId,
            coachName: data.user.coachName,
            coachEmail: data.user.coachEmail,
            coachPhone: data.user.coachPhone
          });
          setUserData(data.user);

          // Update form data with real user data
          const formattedBirthdate = data.user.dateofBirth ? 
            (data.user.dateofBirth.includes('T') ? data.user.dateofBirth.split('T')[0] : data.user.dateofBirth) : '';
          
          console.log('Formatted birthdate:', formattedBirthdate);
          
          setFormData({
            name: data.user.name || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
            birthdate: formattedBirthdate,
            bio: data.user.bio || ''
          });
        } else {
          toast.error('Failed to load user data');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [session?.user?.id]);

  // Format name based on privacy setting
  const getDisplayName = () => {
    if (!userData) return '';
    
    if (privacySettings.nameFormat === 'firstInitial') {
      const nameParts = userData.name ? userData.name.split(' ') : ['', ''];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      return `${firstName} ${lastName.charAt(0)}.`;
    }
    return userData.name || '';
  };

  const [showCustomGoalDialog, setShowCustomGoalDialog] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalDescription, setNewGoalDescription] = useState("");
  
  const [showCustomBadHabitDialog, setShowCustomBadHabitDialog] = useState(false);
  const [newBadHabitName, setNewBadHabitName] = useState("");
  const [newBadHabitDescription, setNewBadHabitDescription] = useState("");

  // Contact therapist dialog state
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Mobile detection with more breakpoints
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640); // sm breakpoint
      setIsTablet(width >= 640 && width < 1024); // md breakpoint
    };

    // Check on mount
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update userData with the response
        setUserData(data.user);
        toast.success('Profile updated successfully!');
      } else {
        throw new Error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Get assigned therapist from user data
  const assignedTherapist = userData?.coachId ? {
    name: userData.coachName || "Your Coach", 
    specialization: "Mental Health Professional", 
    since: "Recently",
    email: userData.coachEmail || "stevenjohn201315@gmail.com", // Use real coach email
    phone: userData.coachPhone || "+1 (555) 000-0000"
  } : {
    name: "Dr. Steven Johnson", 
    specialization: "Mental Health Professional", 
    since: "Recently",
    email: "stevenjohn201315@gmail.com", // Your actual coach email
    phone: "+1 (555) 000-0000"
  };

  // Get real groups data - joined groups and available groups
  const joinedGroups = groups.filter(group => group.isJoined);
  const availableGroups = groups.filter(group => !group.isJoined);
  
  // Use the first joined group as current group, or show empty state
  const currentGroup = joinedGroups.length > 0 ? {
    id: joinedGroups[0].id,
    name: joinedGroups[0].name,
    description: joinedGroups[0].description,
    members: joinedGroups[0].members?.length || 0,
    maxMembers: joinedGroups[0].maxMembers || 15,
    joinedDate: "Recently", // We could calculate this from actual join date
    nextSession: "TBD", // We could get this from sessions API
    sessionFrequency: joinedGroups[0].sessionFrequency || "Weekly",
    status: joinedGroups[0].status || "Active",
    attendance: 85 // We could calculate this from actual attendance
  } : null;

  const handleJoinRequest = async (groupId, groupName) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/membership-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: groupId,
          message: `I would like to join ${groupName}`
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Join request sent for ${groupName}!`);
      } else {
        throw new Error(data.error || 'Failed to send join request');
      }
    } catch (error) {
      console.error('Error sending join request:', error);
      toast.error(error.message || 'Failed to send join request');
    }
  };

  // Handle contact therapist
  const handleContactTherapist = () => {
    setShowContactDialog(true);
  };

  const handleSendMessage = async () => {
    if (!contactMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    console.log('Sending message with data:', {
      message: contactMessage.trim(),
      coachEmail: assignedTherapist.email,
      coachName: assignedTherapist.name,
      clientName: userData?.name || 'Client',
      userDataCoachEmail: userData?.coachEmail,
      userDataCoachId: userData?.coachId
    });

    try {
      setSendingMessage(true);
      
      const response = await fetch('/api/contact/coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: contactMessage.trim(),
          coachEmail: assignedTherapist.email,
          coachName: assignedTherapist.name,
          clientName: userData?.name || 'Client'
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Message sent successfully!');
        setContactMessage("");
        setShowContactDialog(false);
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className={`${isMobile ? 'px-4 pb-20' : 'pb-6'}`}>
        <div className={`space-y-6 ${isMobile ? 'space-y-4' : 'space-y-8'} max-w-6xl mx-auto`}>
          <div className={`${isMobile ? 'text-center pt-4' : 'pt-6'}`}>
            <h1 className={`font-bold tracking-tight ${isMobile ? 'text-2xl' : 'text-3xl'}`}>My Profile</h1>
            <p className={`text-muted-foreground ${isMobile ? 'text-sm mt-1' : 'mt-2'}`}>
              Loading your profile...
            </p>
          </div>
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground text-sm">Please wait while we load your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'px-4 pb-20' : 'pb-6'}`}>
      <div className={`space-y-6 ${isMobile ? 'space-y-4' : 'space-y-8'} max-w-6xl mx-auto`}>
        <div className={`${isMobile ? 'text-center pt-4' : 'pt-6'}`}>
          <h1 className={`font-bold tracking-tight ${isMobile ? 'text-2xl' : 'text-3xl'}`}>My Profile</h1>
          <p className={`text-muted-foreground ${isMobile ? 'text-sm mt-1' : 'mt-2'}`}>
            Manage your personal information and preferences.
          </p>
        </div>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className={`w-full ${isMobile ? 'grid grid-cols-2 gap-1 h-auto p-1' : isTablet ? 'grid grid-cols-4 gap-1 h-auto p-2' : 'grid grid-cols-4'}`}>
          <TabsTrigger 
            value="personal" 
            className={`${isMobile ? 'h-14 text-xs px-1 py-2' : isTablet ? 'h-12 text-sm px-2 py-2' : 'flex-1'}`}
          >
            <div className={`flex items-center gap-1 ${isMobile ? 'flex-col' : 'flex-row'}`}>
              <User className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
                {isMobile ? "Profile" : isTablet ? "Profile" : "Personal Info"}
              </span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="goals" 
            className={`${isMobile ? 'h-14 text-xs px-1 py-2' : isTablet ? 'h-12 text-sm px-2 py-2' : 'flex-1'}`}
          >
            <div className={`flex items-center gap-1 ${isMobile ? 'flex-col' : 'flex-row'}`}>
              <Target className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
                {isMobile ? "Goals" : isTablet ? "Goals" : "Goals & Progress"}
              </span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="group" 
            className={`${isMobile ? 'h-14 text-xs px-1 py-2' : isTablet ? 'h-12 text-sm px-2 py-2' : 'flex-1'}`}
          >
            <div className={`flex items-center gap-1 ${isMobile ? 'flex-col' : 'flex-row'}`}>
              <Users className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
                {isMobile ? "Groups" : isTablet ? "Groups" : "My Group"}
              </span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className={`${isMobile ? 'h-14 text-xs px-1 py-2' : isTablet ? 'h-12 text-sm px-2 py-2' : 'flex-1'}`}
          >
            <div className={`flex items-center gap-1 ${isMobile ? 'flex-col' : 'flex-row'}`}>
              <Shield className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>Settings</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className={`space-y-4 ${isMobile ? 'space-y-3' : ''}`}>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'md:grid-cols-3'}`}>
            {/* Profile Picture */}
            <Card className={`${isMobile ? 'order-2' : ''}`}>
              <CardHeader className={`${isMobile ? 'pb-3' : ''}`}>
                <CardTitle className={`${isMobile ? 'text-lg' : ''}`}>Profile Picture</CardTitle>
              </CardHeader>
              <CardContent className={`text-center space-y-4 ${isMobile ? 'py-4' : ''}`}>
                <Avatar className={`mx-auto ${isMobile ? 'h-20 w-20' : 'h-24 w-24'}`}>
                  <AvatarFallback className={`bg-primary text-primary-foreground ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                    {userData ? 
                      (userData.name ? userData.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U') 
                      : 'U'
                    }
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" size={isMobile ? "sm" : "sm"} className="w-full">
                  Change Photo
                </Button>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <div className={`${isMobile ? 'order-1' : ''} ${isMobile ? '' : isTablet ? 'col-span-2' : 'md:col-span-2'}`}>
              <Card>
                <CardHeader className={`${isMobile ? 'pb-3' : ''}`}>
                  <CardTitle className={`${isMobile ? 'text-lg' : ''}`}>Personal Information</CardTitle>
                  <CardDescription className={`${isMobile ? 'text-sm' : ''}`}>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className={`space-y-4 ${isMobile ? 'space-y-3' : ''}`}>
                  <div className="space-y-2">
                    <Label htmlFor="name" className={`${isMobile ? 'text-sm' : ''}`}>Full Name *</Label>
                    <Input 
                      id="name" 
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`${isMobile ? 'h-10' : ''}`}
                      disabled={loading}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className={`${isMobile ? 'text-sm' : ''}`}>Email *</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`${isMobile ? 'h-10' : ''}`}
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className={`${isMobile ? 'text-sm' : ''}`}>Phone</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`${isMobile ? 'h-10' : ''}`}
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="birthdate" className={`${isMobile ? 'text-sm' : ''}`}>Date of Birth</Label>
                    <Input 
                      id="birthdate" 
                      type="date" 
                      value={formData.birthdate}
                      onChange={(e) => handleInputChange('birthdate', e.target.value)}
                      className={`${isMobile ? 'h-10' : ''}`}
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio" className={`${isMobile ? 'text-sm' : ''}`}>About Me</Label>
                    <Textarea 
                      id="bio" 
                      placeholder="Tell us a bit about yourself..."
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      className={`${isMobile ? 'min-h-20' : 'min-h-24'}`}
                      disabled={loading}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={saving || loading}
                    className={`w-full ${isMobile ? 'h-10' : ''}`}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Assigned Therapist Section - Integrated into Personal Info */}
          <Card>
            <CardHeader className={`${isMobile ? 'pb-3' : ''}`}>
              <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : ''}`}>
                <User className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                My Therapist
              </CardTitle>
              <CardDescription className={`${isMobile ? 'text-sm' : ''}`}>Your assigned mental health professional (full access)</CardDescription>
            </CardHeader>
            <CardContent className={`${isMobile ? 'p-3' : ''}`}>
              <div className={`${isMobile ? 'flex flex-col space-y-3 p-3' : 'flex items-center justify-between p-4'} border rounded-lg bg-muted/30`}>
                <div className={`flex items-center ${isMobile ? 'space-x-3' : 'space-x-4'}`}>
                  <Avatar className={`${isMobile ? 'h-10 w-10' : 'h-12 w-12'}`}>
                    <AvatarFallback className={`bg-primary text-primary-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
                      {assignedTherapist.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`${isMobile ? 'flex-1' : ''}`}>
                    <h3 className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{assignedTherapist.name}</h3>
                    <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>{assignedTherapist.specialization}</p>
                    <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>Working together since {assignedTherapist.since}</p>
                  </div>
                </div>
                <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
                  <Button 
                    variant="outline" 
                    size={isMobile ? "sm" : "sm"} 
                    className={`${isMobile ? 'flex-1' : ''}`}
                    onClick={handleContactTherapist}
                  >
                    <MessageCircle className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-1'}`} />
                    Contact
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className={`space-y-4 ${isMobile ? 'space-y-3' : ''}`}>
          {/* Loading State */}
          {goalsLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Loading goals...</span>
            </div>
          )}

          {/* Error State */}
          {goalsError && (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-red-500 mb-2">⚠️</div>
                <p className="text-muted-foreground">{goalsError}</p>
                <p className="text-sm text-muted-foreground mt-2">Using demo data as fallback</p>
              </CardContent>
            </Card>
          )}

          {/* Overall Progress */}
          {!goalsLoading && (
            <>
            <Card>
            <CardHeader className={`${isMobile ? 'pb-3' : ''}`}>
              <CardTitle className={`${isMobile ? 'text-lg' : ''}`}>Overall Progress</CardTitle>
              <CardDescription className={`${isMobile ? 'text-sm' : ''}`}>Your current goal achievement level</CardDescription>
            </CardHeader>
            <CardContent className={`${isMobile ? 'p-4' : ''}`}>
              <div className={`text-center space-y-4 ${isMobile ? 'space-y-3' : ''}`}>
                <div className={`font-bold text-primary ${isMobile ? 'text-3xl' : 'text-4xl'}`}>
                  {calculateOverallScore()}%
                </div>
                <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
                  Based on {goals.filter(g => g.isActive).length} active goals
                </p>
                <div className={`w-full bg-secondary rounded-full ${isMobile ? 'h-2' : 'h-3'}`}>
                  <div 
                    className={`bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 ${isMobile ? 'h-2' : 'h-3'}`}
                    style={{ width: `${calculateOverallScore()}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Life Area Goals */}
          <Card>
            <CardHeader className={`${isMobile ? 'pb-3' : ''}`}>
              <CardTitle className={`flex items-center justify-between ${isMobile ? 'flex-col items-start gap-2' : ''}`}>
                <div className={`flex items-center gap-2 ${isMobile ? 'text-lg' : ''}`}>
                  <Target className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                  Life Area Goals
                </div>
                <Badge variant="outline" className={`${isMobile ? 'text-xs' : ''}`}>
                  {goals.filter(g => g.isActive).length} / {goals.length} active
                </Badge>
              </CardTitle>
              <CardDescription className={`${isMobile ? 'text-sm' : ''}`}>
                Activate goals you want to track daily
              </CardDescription>
            </CardHeader>
            <CardContent className={`${isMobile ? 'p-3' : ''}`}>
              <div className={`space-y-3 ${isMobile ? 'space-y-2' : 'space-y-4'}`}>
                {goals.map((goal) => (
                  <div key={goal.id} className={`${isMobile ? 'flex flex-col space-y-3 p-3' : 'flex items-center justify-between p-4'} border rounded-lg`}>
                    <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-4'} flex-1`}>
                      <div className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>{goal.icon}</div>
                      <div className="flex-1">
                        <div className={`flex items-center gap-2 mb-1 ${isMobile ? 'flex-wrap' : ''}`}>
                          <h3 className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{goal.name}</h3>
                          {goal.category === 'custom' && (
                            <Badge variant="secondary" className={`${isMobile ? 'text-xs px-1 py-0' : 'text-xs'}`}>Custom</Badge>
                          )}
                        </div>
                        <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          {goal.description}
                        </p>
                        {goal.isActive && (
                          <div className={`mt-2 ${isMobile ? 'mt-1' : ''}`}>
                            <div className={`flex items-center gap-2 text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                              <span>Current: {goal.currentScore}/5</span>
                              <div className={`bg-secondary rounded-full ${isMobile ? 'w-12 h-1' : 'w-16 h-1'}`}>
                                <div 
                                  className={`rounded-full transition-all ${isMobile ? 'h-1' : 'h-1'}`}
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
                    <div className={`flex items-center gap-2 ${isMobile ? 'justify-between' : ''}`}>
                      {goal.category === 'custom' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCustomGoal(goal.id, goal.name)}
                          className={`text-destructive hover:text-destructive ${isMobile ? 'h-7 w-7' : 'h-8 w-8'}`}
                        >
                          <Trash2 className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                        </Button>
                      )}
                      <Switch
                        checked={goal.isActive}
                        onCheckedChange={() => handleToggleGoal(goal.id)}
                        className={`${isMobile ? 'ml-auto' : ''}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Add Custom Goal Button */}
              <div className={`mt-4 pt-4 border-t ${isMobile ? 'mt-3 pt-3' : ''}`}>
                {!showCustomGoalDialog ? (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCustomGoalDialog(true)}
                    className={`w-full ${isMobile ? 'h-10' : ''}`}
                  >
                    <Plus className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                    Add Custom Goal
                  </Button>
                ) : (
                  <div className={`space-y-3 p-4 border rounded-lg bg-muted/20 ${isMobile ? 'space-y-2 p-3' : ''}`}>
                    <div className="space-y-2">
                      <Label className={`${isMobile ? 'text-sm' : ''}`}>Goal Name</Label>
                      <Input
                        placeholder="e.g., Learn a new skill"
                        value={newGoalName}
                        onChange={(e) => setNewGoalName(e.target.value)}
                        className={`${isMobile ? 'h-10' : ''}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={`${isMobile ? 'text-sm' : ''}`}>Description</Label>
                      <Textarea
                        placeholder="Describe what this goal means to you..."
                        value={newGoalDescription}
                        onChange={(e) => setNewGoalDescription(e.target.value)}
                        className={`${isMobile ? 'min-h-16' : 'min-h-20'}`}
                      />
                    </div>
                    <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
                      <Button onClick={handleAddCustomGoal} size={isMobile ? "sm" : "sm"} className={`${isMobile ? 'w-full h-10' : ''}`}>
                        Add Goal
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowCustomGoalDialog(false);
                          setNewGoalName("");
                          setNewGoalDescription("");
                        }}
                        size={isMobile ? "sm" : "sm"}
                        className={`${isMobile ? 'w-full h-10' : ''}`}
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
            <CardHeader className={`${isMobile ? 'pb-3' : ''}`}>
              <CardTitle className={`flex items-center justify-between ${isMobile ? 'flex-col items-start gap-2' : ''}`}>
                <div className={`flex items-center gap-2 ${isMobile ? 'text-lg' : ''}`}>
                  <TrendingDown className={`text-destructive ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                  Habits to Reduce
                </div>
                <Badge variant="outline" className={`${isMobile ? 'text-xs' : ''}`}>
                  {badHabits.filter(h => h.isActive).length} / {badHabits.length} tracking
                </Badge>
              </CardTitle>
              <CardDescription className={`${isMobile ? 'text-sm' : ''}`}>
                Select habits you want to track and reduce
              </CardDescription>
            </CardHeader>
            <CardContent className={`${isMobile ? 'p-3' : ''}`}>
              <div className={`space-y-3 ${isMobile ? 'space-y-2' : 'space-y-4'}`}>
                {badHabits.map((habit) => (
                  <div key={habit.id} className={`${isMobile ? 'flex flex-col space-y-3 p-3' : 'flex items-center justify-between p-4'} border rounded-lg`}>
                    <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-4'} flex-1`}>
                      <div className={`${isMobile ? 'text-xl' : 'text-2xl'}`}>{habit.icon}</div>
                      <div className="flex-1">
                        <div className={`flex items-center gap-2 mb-1 ${isMobile ? 'flex-wrap' : ''}`}>
                          <h3 className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{habit.name}</h3>
                          {habit.category === 'custom' && (
                            <Badge variant="secondary" className={`${isMobile ? 'text-xs px-1 py-0' : 'text-xs'}`}>Custom</Badge>
                          )}
                        </div>
                        <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          {habit.description}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 ${isMobile ? 'justify-between' : ''}`}>
                      {habit.category === 'custom' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCustomBadHabit(habit.id, habit.name)}
                          className={`text-destructive hover:text-destructive ${isMobile ? 'h-7 w-7' : 'h-8 w-8'}`}
                        >
                          <Trash2 className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                        </Button>
                      )}
                      <Switch
                        checked={habit.isActive}
                        onCheckedChange={() => handleToggleBadHabit(habit.id)}
                        className={`${isMobile ? 'ml-auto' : ''}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Add Custom Bad Habit Button */}
              <div className={`mt-4 pt-4 border-t ${isMobile ? 'mt-3 pt-3' : ''}`}>
                {!showCustomBadHabitDialog ? (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCustomBadHabitDialog(true)}
                    className={`w-full ${isMobile ? 'h-10' : ''}`}
                  >
                    <Plus className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                    Add Custom Habit to Reduce
                  </Button>
                ) : (
                  <div className={`space-y-3 p-4 border rounded-lg bg-muted/20 ${isMobile ? 'space-y-2 p-3' : ''}`}>
                    <div className="space-y-2">
                      <Label className={`${isMobile ? 'text-sm' : ''}`}>Habit Name</Label>
                      <Input
                        placeholder="e.g., Excessive screen time"
                        value={newBadHabitName}
                        onChange={(e) => setNewBadHabitName(e.target.value)}
                        className={`${isMobile ? 'h-10' : ''}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={`${isMobile ? 'text-sm' : ''}`}>Description</Label>
                      <Textarea
                        placeholder="Describe the habit you want to reduce..."
                        value={newBadHabitDescription}
                        onChange={(e) => setNewBadHabitDescription(e.target.value)}
                        className={`${isMobile ? 'min-h-16' : 'min-h-20'}`}
                      />
                    </div>
                    <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
                      <Button onClick={handleAddCustomBadHabit} size={isMobile ? "sm" : "sm"} className={`${isMobile ? 'w-full h-10' : ''}`}>
                        Add Habit
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowCustomBadHabitDialog(false);
                          setNewBadHabitName("");
                          setNewBadHabitDescription("");
                        }}
                        size={isMobile ? "sm" : "sm"}
                        className={`${isMobile ? 'w-full h-10' : ''}`}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          </>
          )}
        </TabsContent>

        <TabsContent value="group" className={`space-y-4 ${isMobile ? 'space-y-3' : ''}`}>
          {/* Loading State */}
          {groupsLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Loading groups...</span>
            </div>
          )}

          {/* Error State */}
          {groupsError && (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-red-500 mb-2">⚠️</div>
                <p className="text-muted-foreground">{groupsError}</p>
                <p className="text-sm text-muted-foreground mt-2">Unable to load groups data</p>
              </CardContent>
            </Card>
          )}

          {/* Groups Content */}
          {!groupsLoading && !groupsError && (
            <>
              {/* Current Group Section */}
              {currentGroup ? (
                <Card>
                  <CardHeader className={`${isMobile ? 'pb-3' : ''}`}>
                    <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : ''}`}>
                      <Users className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                      My Group
                    </CardTitle>
                    <CardDescription className={`${isMobile ? 'text-sm' : ''}`}>Support group you're currently participating in</CardDescription>
                  </CardHeader>
                  <CardContent className={`${isMobile ? 'p-3' : ''}`}>
                    <div className={`p-4 border rounded-lg bg-muted/30 ${isMobile ? 'p-3' : ''}`}>
                      <div className={`flex ${isMobile ? 'flex-col space-y-3' : isTablet ? 'flex-col space-y-3' : 'items-start justify-between'} mb-3`}>
                        <div className="flex-1">
                          <div className={`flex items-center gap-2 mb-1 ${isMobile ? 'flex-wrap' : ''}`}>
                            <h3 className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{currentGroup.name}</h3>
                            <Badge variant="default" className={`${isMobile ? 'text-xs px-1 py-0' : ''}`}>{currentGroup.status}</Badge>
                          </div>
                          <p className={`text-muted-foreground mb-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>{currentGroup.description}</p>
                          <div className={`flex ${isMobile ? 'flex-col gap-2' : isTablet ? 'flex-col gap-2' : 'flex-wrap gap-4'} text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                            <div className="flex items-center gap-1">
                              <Calendar className={`${isMobile ? 'h-3 w-3' : 'h-3 w-3'}`} />
                              <span>Joined {currentGroup.joinedDate}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className={`${isMobile ? 'h-3 w-3' : 'h-3 w-3'}`} />
                              <span>{currentGroup.sessionFrequency}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className={`${isMobile ? 'h-3 w-3' : 'h-3 w-3'}`} />
                              <span>{currentGroup.members}/{currentGroup.maxMembers} members</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className={`${isMobile ? 'h-3 w-3' : 'h-3 w-3'}`} />
                              <span>{currentGroup.attendance}% attendance</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className={`flex ${isMobile ? 'flex-col gap-2' : isTablet ? 'flex-col gap-2' : 'items-center justify-between'}`}>
                        <div className={`text-sm ${isMobile ? 'text-xs' : ''}`}>
                          <span className="font-medium">Next session: </span>
                          <span className="text-muted-foreground">{currentGroup.nextSession}</span>
                        </div>
                        <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
                          <Button 
                            variant="outline" 
                            size={isMobile ? "sm" : "sm"} 
                            className={`${isMobile ? 'flex-1 h-10' : ''}`}
                            onClick={() => router.push('/client/groups')}
                          >
                            View Group
                          </Button>
                          <Button 
                            variant="outline" 
                            size={isMobile ? "sm" : "sm"} 
                            className={`${isMobile ? 'flex-1 h-10' : ''}`}
                            onClick={() => router.push(`/client/group/${currentGroup.id}?groupName=${encodeURIComponent(currentGroup.name)}`)}
                          >
                            <MessageCircle className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-1'}`} />
                            Chat
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-muted-foreground mb-4">
                      <Users className="h-12 w-12 mx-auto mb-2" />
                      <h3 className="text-lg font-medium">No Groups Yet</h3>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      You haven't joined any support groups yet. Browse available groups to get started.
                    </p>
                    <Button 
                      onClick={() => router.push('/client/groups')}
                      className="w-full"
                    >
                      Browse All Groups
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Available Groups Section */}
              {availableGroups.length > 0 && (
                <Card>
                  <CardHeader className={`${isMobile ? 'pb-3' : ''}`}>
                    <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : ''}`}>
                      <UserPlus className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                      Available Groups ({availableGroups.length})
                    </CardTitle>
                    <CardDescription className={`${isMobile ? 'text-sm' : ''}`}>Join new support groups that match your interests</CardDescription>
                  </CardHeader>
                  <CardContent className={`${isMobile ? 'p-3' : ''}`}>
                    <div className={`space-y-3 ${isMobile ? 'space-y-2' : 'space-y-4'}`}>
                      {availableGroups.map((group) => (
                        <div key={group.id} className={`p-4 border rounded-lg ${isMobile ? 'p-3' : ''}`}>
                          <div className={`flex ${isMobile ? 'flex-col space-y-3' : isTablet ? 'flex-col space-y-3' : 'items-start justify-between'} mb-3`}>
                            <div className="flex-1">
                              <h3 className={`font-medium mb-1 ${isMobile ? 'text-sm' : ''}`}>{group.name}</h3>
                              <p className={`text-muted-foreground mb-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>{group.description}</p>
                              <div className={`flex ${isMobile ? 'flex-col gap-2' : isTablet ? 'flex-col gap-2' : 'flex-wrap gap-4'} text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                                <div className="flex items-center gap-1">
                                  <Clock className={`${isMobile ? 'h-3 w-3' : 'h-3 w-3'}`} />
                                  <span>{group.sessionFrequency || 'Weekly'} • {group.duration || '8 weeks'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className={`${isMobile ? 'h-3 w-3' : 'h-3 w-3'}`} />
                                  <span>{group.members?.length || 0}/{group.maxMembers || 15} members</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className={`${isMobile ? 'h-3 w-3' : 'h-3 w-3'}`} />
                                  <span>Starts {group.nextSession || 'TBD'}</span>
                                </div>
                              </div>
                            </div>
                            {!isMobile && !isTablet && (
                              <div className="ml-4">
                                <Badge variant="secondary" className="mb-2">
                                  {(group.maxMembers || 15) - (group.members?.length || 0)} seats left
                                </Badge>
                              </div>
                            )}
                          </div>
                          <div className={`flex ${isMobile ? 'flex-col gap-2' : isTablet ? 'flex-col gap-2' : 'items-center justify-between'}`}>
                            <div className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                              {group.members?.length || 0}/{group.maxMembers || 15} members
                              {(isMobile || isTablet) && (
                                <Badge variant="secondary" className={`ml-2 ${isMobile ? 'text-xs px-1 py-0' : ''}`}>
                                  {(group.maxMembers || 15) - (group.members?.length || 0)} seats left
                                </Badge>
                              )}
                            </div>
                            <Button 
                              onClick={() => handleJoinRequest(group.id, group.name)}
                              className={`flex items-center gap-2 ${isMobile ? 'w-full h-10' : ''}`}
                              size={isMobile ? "sm" : "sm"}
                            >
                              <UserPlus className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                              Request to Join
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>


        <TabsContent value="settings" className={`space-y-4 ${isMobile ? 'space-y-3' : ''}`}>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
            {/* Group Privacy Settings */}
            <Card>
              <CardHeader className={`${isMobile ? 'pb-3' : ''}`}>
                <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : ''}`}>
                  <Users className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                  Group Member Visibility
                </CardTitle>
                <CardDescription className={`${isMobile ? 'text-sm' : ''}`}>Control what other group members can see</CardDescription>
              </CardHeader>
              <CardContent className={`space-y-4 ${isMobile ? 'space-y-3 p-3' : ''}`}>
                <div className={`flex items-center justify-between ${isMobile ? 'flex-col items-start gap-2' : ''}`}>
                  <div className="space-y-0.5">
                    <Label className={`${isMobile ? 'text-sm' : ''}`}>Profile Picture</Label>
                    <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      Show your profile picture to group members
                    </p>
                  </div>
                  <Switch 
                    checked={privacySettings.profilePictureVisible}
                    onCheckedChange={(checked) => 
                      setPrivacySettings(prev => ({ ...prev, profilePictureVisible: checked }))
                    }
                    className={`${isMobile ? 'self-end' : ''}`}
                  />
                </div>
                
                <div className={`flex items-center justify-between ${isMobile ? 'flex-col items-start gap-2' : ''}`}>
                  <div className="space-y-0.5">
                    <Label className={`${isMobile ? 'text-sm' : ''}`}>Name Format</Label>
                    <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      {privacySettings.nameFormat === 'full' ? 'Show full name' : 'Show first name + last initial'}
                    </p>
                  </div>
                  <Switch 
                    checked={privacySettings.nameFormat === 'full'}
                    onCheckedChange={(checked) => 
                      setPrivacySettings(prev => ({ ...prev, nameFormat: checked ? 'full' : 'firstInitial' }))
                    }
                    className={`${isMobile ? 'self-end' : ''}`}
                  />
                </div>
                
                <div className={`flex items-center justify-between ${isMobile ? 'flex-col items-start gap-2' : ''}`}>
                  <div className="space-y-0.5">
                    <Label className={`${isMobile ? 'text-sm' : ''}`}>Online Status</Label>
                    <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      Show when you're online in group chats
                    </p>
                  </div>
                  <Switch 
                    checked={privacySettings.onlineStatusVisible}
                    onCheckedChange={(checked) => 
                      setPrivacySettings(prev => ({ ...prev, onlineStatusVisible: checked }))
                    }
                    className={`${isMobile ? 'self-end' : ''}`}
                  />
                </div>

                <div className={`pt-2 border-t ${isMobile ? 'pt-3' : ''}`}>
                  <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                    <Shield className={`inline mr-1 ${isMobile ? 'h-3 w-3' : 'h-3 w-3'}`} />
                    Your coach/therapist always has full access to your profile and progress
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader className={`${isMobile ? 'pb-3' : ''}`}>
                <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : ''}`}>
                  <Bell className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                  Notifications
                </CardTitle>
                <CardDescription className={`${isMobile ? 'text-sm' : ''}`}>Choose what notifications you receive</CardDescription>
              </CardHeader>
              <CardContent className={`space-y-4 ${isMobile ? 'space-y-3 p-3' : ''}`}>
                <div className={`flex items-center justify-between ${isMobile ? 'flex-col items-start gap-2' : ''}`}>
                  <div className="space-y-0.5">
                    <Label className={`${isMobile ? 'text-sm' : ''}`}>Session Reminders</Label>
                    <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      Get reminded about upcoming sessions
                    </p>
                  </div>
                  <Switch defaultChecked className={`${isMobile ? 'self-end' : ''}`} />
                </div>
                
                <div className={`flex items-center justify-between ${isMobile ? 'flex-col items-start gap-2' : ''}`}>
                  <div className="space-y-0.5">
                    <Label className={`${isMobile ? 'text-sm' : ''}`}>Goal Updates</Label>
                    <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      Notifications about goal progress
                    </p>
                  </div>
                  <Switch defaultChecked className={`${isMobile ? 'self-end' : ''}`} />
                </div>
                
                <div className={`flex items-center justify-between ${isMobile ? 'flex-col items-start gap-2' : ''}`}>
                  <div className="space-y-0.5">
                    <Label className={`${isMobile ? 'text-sm' : ''}`}>Group Messages</Label>
                    <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      Notifications for new group messages
                    </p>
                  </div>
                  <Switch defaultChecked className={`${isMobile ? 'self-end' : ''}`} />
                </div>
                
                <div className={`flex items-center justify-between ${isMobile ? 'flex-col items-start gap-2' : ''}`}>
                  <div className="space-y-0.5">
                    <Label className={`${isMobile ? 'text-sm' : ''}`}>New Resources</Label>
                    <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      Get notified about new helpful resources
                    </p>
                  </div>
                  <Switch className={`${isMobile ? 'self-end' : ''}`} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Contact Therapist Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className={`${isMobile ? 'mx-4' : ''}`}>
          <DialogHeader>
            <DialogTitle className={`${isMobile ? 'text-lg' : ''}`}>Contact Your Therapist</DialogTitle>
            <DialogDescription className={`${isMobile ? 'text-sm' : ''}`}>
              Send a message to {assignedTherapist.name}. They will receive an email notification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact-message" className={`${isMobile ? 'text-sm' : ''}`}>Your Message</Label>
              <Textarea
                id="contact-message"
                placeholder="Type your message here..."
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                className={`${isMobile ? 'min-h-24' : 'min-h-32'}`}
                disabled={sendingMessage}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowContactDialog(false);
                  setContactMessage("");
                }}
                disabled={sendingMessage}
                size={isMobile ? "sm" : "sm"}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSendMessage}
                disabled={sendingMessage || !contactMessage.trim()}
                size={isMobile ? "sm" : "sm"}
              >
                {sendingMessage ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
