"use client"

import { useState } from "react";
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
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
    calendar: true
  });

  const [pipelineStages, setPipelineStages] = useState([
    { id: "light", name: "Light", color: "bg-blue-500" },
    { id: "group", name: "Group", color: "bg-yellow-500" },
    { id: "personal", name: "Personal", color: "bg-purple-500" },
    { id: "completed", name: "Completed", color: "bg-green-500" },
    { id: "inactive", name: "Inactive", color: "bg-red-500" }
  ]);

  const handleDeleteAccount = () => {
    console.log("Account deletion requested");
    // TODO: Implement actual account deletion logic
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      DR
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline">Change Photo</Button>
                    <p className="text-xs text-muted-foreground mt-1">Change your profile photo</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue="Dr. Sarah" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue="Johnson" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="sarah.johnson@mentalcoach.com" />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
                </div>

                <div>
                  <Label htmlFor="license">Professional License</Label>
                  <Input id="license" defaultValue="LPC-12345678" />
                </div>

                <Button className="w-full">Save Changes</Button>
              </CardContent>
            </Card>

            <Card className="card-standard">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Practice Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="practice">Practice Name</Label>
                  <Input id="practice" defaultValue="Mindful Wellness Center" />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" defaultValue="123 Wellness Street" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" defaultValue="San Francisco" />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input id="state" defaultValue="CA" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input id="timezone" defaultValue="Pacific Time (UTC-8)" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Online Sessions</Label>
                    <p className="text-sm text-muted-foreground">Enable or disable online sessions</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Button className="w-full">Update Practice Info</Button>
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
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Enable or disable email notifications</p>
                  </div>
                </div>
                <Switch 
                  checked={notifications.email} 
                  onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-primary" />
                  <div>
                      <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Enable or disable push notifications</p>
                  </div>
                </div>
                <Switch 
                  checked={notifications.push} 
                  onCheckedChange={(checked) => setNotifications({...notifications, push: checked})}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Enable or disable SMS notifications</p>
                  </div>
                </div>
                <Switch 
                  checked={notifications.sms} 
                  onCheckedChange={(checked) => setNotifications({...notifications, sms: checked})}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <Label>Calendar Sync</Label>
                    <p className="text-sm text-muted-foreground">Enable or disable calendar sync</p>
                  </div>
                </div>
                <Switch 
                  checked={notifications.calendar} 
                  onCheckedChange={(checked) => setNotifications({...notifications, calendar: checked})}
                />
              </div>

              <div className="pt-4">
                <h4 className="font-medium mb-4">Timing</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Session Reminders</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">24 hours before</span>
                    </div>
                  </div>
                  <div>
                    <Label>Follow-up Reminders</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">1 week after</span>
                    </div>
                  </div>
                </div>
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
                  <Input id="currentPassword" type="password" />
                </div>

                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>

                <Button className="w-full">Update Password</Button>

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
                  Privacy & Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Data Encryption</Label>
                    <p className="text-sm text-muted-foreground">Enable or disable data encryption</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Session Recordings</Label>
                    <p className="text-sm text-muted-foreground">Enable or disable session recordings</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Analytics</Label>
                    <p className="text-sm text-muted-foreground">Enable or disable analytics</p>
                  </div>
                  <Switch />
                </div>

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
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Are you sure you want to delete your account? This action cannot be undone. All your data, including client information, sessions, and settings will be permanently deleted.
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
