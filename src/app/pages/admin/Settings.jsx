"use client"

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Separator } from "@/app/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { LanguageSelector } from "@/app/components/LanguageSelector";
import { 
  User, 
  Settings as SettingsIcon,
  Camera,
  X,
  Loader2
} from "lucide-react";

// Simple translation function for demo purposes
const t = (key) => {
  const translations = {
    'settings:general.title': 'General Settings',
    'settings:general.description': 'Configure basic platform settings',
    'settings:general.platformName': 'Platform Name',
    'settings:general.supportEmail': 'Support Email',
    'settings:general.maxClients': 'Maximum Clients per Coach',
    'settings:general.sessionDuration': 'Session Duration (minutes)',
    'settings:security.title': 'Security Settings',
    'settings:security.description': 'Configure security and authentication settings',
    'settings:security.twoFactorAuth': 'Two-Factor Authentication',
    'settings:security.sessionTimeout': 'Session Timeout',
    'settings:notifications.title': 'Notification Settings',
    'settings:notifications.description': 'Configure notification preferences',
    'settings:notifications.emailNotifications': 'Email Notifications',
    'settings:notifications.weeklyReports': 'Weekly Reports',
    'common:buttons.cancel': 'Cancel',
    'common:buttons.save': 'Save'
  };
  return translations[key] || key;
};

export default function AdminSettings() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: ''
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Fetch admin data on component mount
  useEffect(() => {
    const fetchAdminData = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/user/profile');
        const data = await response.json();

        if (data.success && data.user) {
          setAdminData(data.user);
          setFormData({
            fullName: data.user.name || '',
            email: data.user.email || '',
            phone: data.user.phone || ''
          });
          
          // Set avatar preview if exists
          if (data.user.avatar) {
            setAvatarPreview(data.user.avatar);
          }
        } else {
          toast.error('Failed to load admin data');
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast.error('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [session?.user?.id]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle avatar file selection
  const handleAvatarFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle avatar upload
  const handleAvatarUpload = async () => {
    const fileInput = document.getElementById('avatar-upload-admin');
    const file = fileInput?.files?.[0];
    
    if (!file) {
      toast.error('Please select an image file');
      return;
    }

    try {
      setUploadingAvatar(true);

      const formDataUpload = new FormData();
      formDataUpload.append('avatar', file);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Avatar uploaded successfully!');
        // Update admin data with new avatar
        setAdminData(prev => ({
          ...prev,
          avatar: data.avatarUrl
        }));
        // Refresh session to get updated avatar
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      } else {
        toast.error(data.error || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle avatar removal
  const handleAvatarRemove = async () => {
    try {
      setUploadingAvatar(true);

      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Avatar removed successfully!');
        setAvatarPreview(null);
        // Update admin data
        setAdminData(prev => ({
          ...prev,
          avatar: null
        }));
        // Refresh session
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      } else {
        toast.error(data.error || 'Failed to remove avatar');
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('Failed to remove avatar');
    } finally {
      setUploadingAvatar(false);
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
          phone: formData.phone
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Profile updated successfully!');
        // Update admin data with new values
        setAdminData(prev => ({
          ...prev,
          name: formData.fullName.trim(),
          email: formData.email,
          phone: formData.phone
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile and platform settings.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-muted">
          <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Profile
          </TabsTrigger>
          <TabsTrigger value="platform" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Platform Settings
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
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      {avatarPreview || adminData?.avatar ? (
                        <AvatarImage 
                          src={avatarPreview || adminData?.avatar} 
                          alt={adminData?.name || 'Profile'} 
                        />
                      ) : null}
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {adminData?.name ? 
                          adminData.name.split(' ').map(n => n[0]).join('').toUpperCase() : 
                          'AD'
                        }
                      </AvatarFallback>
                    </Avatar>
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-full">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="avatar-upload-admin"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarFileSelect}
                        disabled={uploadingAvatar}
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => document.getElementById('avatar-upload-admin')?.click()}
                        disabled={uploadingAvatar}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                      </Button>
                      {avatarPreview && (
                        <>
                          <Button 
                            variant="outline"
                            onClick={handleAvatarUpload}
                            disabled={uploadingAvatar}
                          >
                            {uploadingAvatar ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              'Save Photo'
                            )}
                          </Button>
                          <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAvatarPreview(adminData?.avatar || null);
                              const fileInput = document.getElementById('avatar-upload-admin');
                              if (fileInput) fileInput.value = '';
                            }}
                            disabled={uploadingAvatar}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {adminData?.avatar && !avatarPreview && (
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={handleAvatarRemove}
                          disabled={uploadingAvatar}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG or WebP. Max 5MB.
                    </p>
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
          
          {/* Language Settings */}
          <div className="mt-6">
            <Card className="card-standard">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5 text-primary" />
                  Language Localization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LanguageSelector variant="compact" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Platform Settings */}
        <TabsContent value="platform">
          <div className="grid gap-6">
            {/* General Settings */}
            <Card>
          <CardHeader>
            <CardTitle>{t('settings:general.title')}</CardTitle>
            <CardDescription>{t('settings:general.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="platform-name">{t('settings:general.platformName')}</Label>
              <Input id="platform-name" defaultValue="Mental Health Coach Platform" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="support-email">{t('settings:general.supportEmail')}</Label>
              <Input id="support-email" type="email" defaultValue="support@mentalhealth.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="max-clients">{t('settings:general.maxClients')}</Label>
              <Input id="max-clients" type="number" defaultValue="20" />
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <LanguageSelector />

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings:security.title')}</CardTitle>
            <CardDescription>{t('settings:security.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings:security.twoFactorAuth')}</Label>
                <p className="text-sm text-muted-foreground">
                  Require 2FA for all admin accounts
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings:security.sessionTimeout')}</Label>
                <p className="text-sm text-muted-foreground">
                  Auto logout after inactivity
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="session-duration">{t('settings:general.sessionDuration')}</Label>
              <Input id="session-duration" type="number" defaultValue="60" />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings:notifications.title')}</CardTitle>
            <CardDescription>{t('settings:notifications.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings:notifications.emailNotifications')}</Label>
                <p className="text-sm text-muted-foreground">
                  Send email alerts for critical events
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings:notifications.weeklyReports')}</Label>
                <p className="text-sm text-muted-foreground">
                  Automated weekly platform reports
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

            <div className="flex justify-end space-x-4">
              <Button variant="outline">{t('common:buttons.cancel')}</Button>
              <Button>{t('common:buttons.save')}</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}