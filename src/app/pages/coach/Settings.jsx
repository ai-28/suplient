"use client"

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/app/components/ui/alert-dialog";
import { LanguageSelector } from "@/app/components/LanguageSelector";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Globe,
  Key,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Plus,
  Users2,
  Edit2,
  Edit3,
  Minus
} from "lucide-react";
import { PageHeader } from "@/app/components/PageHeader";

export default function Settings() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coachData, setCoachData] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    license: ''
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [pipelineStages, setPipelineStages] = useState([
    { id: "light", name: "Light", color: "bg-blue-500" },
    { id: "group", name: "Group", color: "bg-yellow-500" },
    { id: "personal", name: "Personal", color: "bg-purple-500" },
    { id: "completed", name: "Completed", color: "bg-green-500" },
    { id: "inactive", name: "Inactive", color: "bg-red-500" }
  ]);

  const handleDeleteAccount = async () => {
    if (!session?.user?.id) {
      toast.error('You must be logged in to delete your account');
      return;
    }

    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Account deleted successfully');
        // Redirect to login page or sign out
        window.location.href = '/auth/signin';
      } else {
        toast.error(data.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  };

  // Fetch coach data on component mount
  useEffect(() => {
    const fetchCoachData = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/user/profile');
        const data = await response.json();

        if (data.success && data.user) {
          console.log('Coach data loaded:', data.user);
          setCoachData(data.user);

          // Update form data with real coach data
          setFormData({
            fullName: data.user.name || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
            license: data.user.license || ''
          });
        } else {
          toast.error('Failed to load coach data');
        }
      } catch (error) {
        console.error('Error fetching coach data:', error);
        toast.error('Failed to load coach data');
      } finally {
        setLoading(false);
      }
    };

    fetchCoachData();
  }, [session?.user?.id]);

  // Load notification preference from localStorage
  useEffect(() => {
    const savedNotificationPreference = localStorage.getItem('notificationsEnabled');
    if (savedNotificationPreference !== null) {
      setNotificationsEnabled(savedNotificationPreference === 'true');
    }
  }, []);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle notification toggle
  const handleNotificationToggle = async (enabled) => {
    setNotificationsEnabled(enabled);
    
    try {
      // Save notification preference to localStorage
      localStorage.setItem('notificationsEnabled', enabled.toString());
      
      toast.success(
        enabled ? "Notifications enabled" : "Notifications disabled",
        {
          description: enabled 
            ? "You'll receive notifications for messages, tasks, and sessions"
            : "You won't receive any notifications"
        }
      );
    } catch (error) {
      console.error('Error saving notification preference:', error);
      toast.error("Failed to save notification preference");
    }
  };

  // Handle password input changes
  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle password update
  const handlePasswordUpdate = async () => {
    if (!session?.user?.id) {
      toast.error('You must be logged in to update password');
      return;
    }

    // Validate passwords
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    try {
      setPasswordLoading(true);
      
      const requestBody = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      };
      
      console.log('Sending password change request:', { 
        hasCurrentPassword: !!requestBody.currentPassword, 
        hasNewPassword: !!requestBody.newPassword 
      });
      
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        toast.success('Password updated successfully!');
        // Clear password fields
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error(data.error || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!session?.user?.id) {
      toast.error('You must be logged in to save changes');
      return;
    }

    try {
      setSaving(true);
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.fullName.trim(),
          email: formData.email,
          phone: formData.phone,
          license: formData.license
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Profile updated successfully!');
        // Update coach data with new values
        setCoachData(prev => ({
          ...prev,
          name: formData.fullName.trim(),
          email: formData.email,
          phone: formData.phone,
          license: formData.license
        }));
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader 
        title={"Settings"} 
        subtitle={"Manage your settings"}
      />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted">
          <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Security
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Pipeline
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            <Card className="card-standard">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Personal Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {coachData?.name ? 
                        coachData.name.split(' ').map(n => n[0]).join('').toUpperCase() : 
                        'DR'
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline">Change Photo</Button>
                    <p className="text-xs text-muted-foreground mt-1">Change your profile photo</p>
                  </div>
                </div>

                  <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    disabled={loading}
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={loading}
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={loading}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <Label htmlFor="license">Professional License</Label>
                  <Input 
                    id="license" 
                    value={formData.license}
                    onChange={(e) => handleInputChange('license', e.target.value)}
                    disabled={loading}
                    placeholder="Enter your professional license"
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleSaveChanges}
                  disabled={loading || saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Language Settings - moved to bottom for better UX */}
          <div className="lg:col-span-2 mt-6">
            <Card className="card-standard">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Language Localization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LanguageSelector variant="compact" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card className="card-standard">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notifications
              </CardTitle>
              <p className="text-sm text-muted-foreground">Choose what notifications you receive</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications for messages, tasks, sessions, and updates
                  </p>
                </div>
                <Switch 
                  checked={notificationsEnabled} 
                  onCheckedChange={handleNotificationToggle}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-standard">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  Password Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input 
                    id="currentPassword" 
                    type="password" 
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    disabled={passwordLoading}
                    placeholder="Enter your current password"
                  />
                </div>

                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    disabled={passwordLoading}
                    placeholder="Enter your new password"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    disabled={passwordLoading}
                    placeholder="Confirm your new password"
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={handlePasswordUpdate}
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </Button>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Enable or disable two-factor authentication</p>
                  </div>
                  <Button variant="outline">Enable 2FA</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="card-standard">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Account Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="pt-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Account</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete your account? This action cannot be undone. All your data, including client information, sessions, and settings will be permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    This action cannot be undone. All your data will be permanently deleted.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pipeline Settings */}
        <TabsContent value="pipeline">
          <div className="space-y-6">
            {/* Client Pipeline Settings */}
            <Card className="card-standard">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users2 className="h-5 w-5 text-primary" />
                  Client Pipeline Stages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Stages</Label>
                      <p className="text-sm text-muted-foreground">Set the stages for your client pipeline</p>
                    </div>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Stage
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {pipelineStages.map((stage) => (
                      <div key={stage.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${stage.color}`} />
                          <span className="font-medium">{stage.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Default Column Visibility</Label>
                    <p className="text-sm text-muted-foreground">Set which columns are visible by default</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {pipelineStages.map((stage) => (
                      <div key={stage.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                          <Label>{stage.name}</Label>
                        </div>
                        <Switch defaultChecked={stage.id !== "inactive"} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <Button className="w-full">Save</Button>
                </div>
              </CardContent>
            </Card>

            {/* Group Pipeline Settings */}
            <Card className="card-standard">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users2 className="h-5 w-5 text-primary" />
                  Group Pipeline Stages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Stages</Label>
                      <p className="text-sm text-muted-foreground">Set the stages for your group pipeline</p>
                    </div>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Stage
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { id: "upcoming", name: "Upcoming", color: "bg-blue-500", description: "Groups scheduled to start" },
                      { id: "ongoing", name: "Ongoing", color: "bg-green-500", description: "Active groups" },
                      { id: "completed", name: "Completed", color: "bg-purple-500", description: "Finished groups" },
                      { id: "inactive", name: "Inactive", color: "bg-gray-500", description: "Paused groups" }
                    ].map((stage) => (
                      <div key={stage.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${stage.color}`} />
                          <div>
                            <span className="font-medium">{stage.name}</span>
                            <p className="text-xs text-muted-foreground">{stage.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            disabled={["upcoming", "ongoing", "completed", "inactive"].includes(stage.id)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Default Funnel Settings</Label>
                    <p className="text-sm text-muted-foreground">Set the default funnel settings for your pipeline</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: "upcoming", name: "Upcoming", color: "bg-blue-500" },
                      { id: "ongoing", name: "Ongoing", color: "bg-green-500" },
                      { id: "completed", name: "Completed", color: "bg-purple-500" },
                      { id: "inactive", name: "Inactive", color: "bg-gray-500" }
                    ].map((stage) => (
                      <div key={stage.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                          <Label>{stage.name}</Label>
                        </div>
                        <Switch defaultChecked={stage.id !== "inactive"} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <Button className="w-full">Save</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
