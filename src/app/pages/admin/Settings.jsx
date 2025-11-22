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
  Loader2,
  Bell
} from "lucide-react";

import { useTranslation } from "@/app/context/LanguageContext";
import { TwoFactorSettings } from "@/app/components/TwoFactorSettings";

function PlatformSettingsTab({ notificationsEnabled, handleNotificationToggle }) {
  const t = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    platformName: 'Mental Coach Platform',
    supportEmail: 'support@mentalcoach.com',
    maxClientsPerCoach: 20,
    language: 'en'
  });

  useEffect(() => {
    fetchPlatformSettings();
  }, []);

  const fetchPlatformSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/platform/settings');
      const data = await response.json();
      
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching platform settings:', error);
        toast.error(t('common.messages.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/platform/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(t('common.messages.saveSuccess'));
        // Reload page to update top bar
        window.location.reload();
      } else {
        toast.error(data.error || t('settings.general.saveFailed', 'Failed to save platform settings'));
      }
    } catch (error) {
      console.error('Error saving platform settings:', error);
      toast.error(t('settings.general.saveFailed', 'Failed to save platform settings'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.general.title')}</CardTitle>
          <CardDescription>{t('settings.general.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="platform-name">{t('settings.general.platformName')}</Label>
            <Input 
              id="platform-name" 
              value={settings.platformName}
              onChange={(e) => setSettings({...settings, platformName: e.target.value})}
              disabled={saving}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="support-email">{t('settings.general.supportEmail')}</Label>
            <Input 
              id="support-email" 
              type="email" 
              value={settings.supportEmail}
              onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
              disabled={saving}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="max-clients">{t('settings.general.maxClients')}</Label>
            <Input 
              id="max-clients" 
              type="number" 
              min="1"
              value={settings.maxClientsPerCoach}
              onChange={(e) => setSettings({...settings, maxClientsPerCoach: parseInt(e.target.value) || 1})}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}

          <LanguageSelector />

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {t('settings.notifications.title', 'Notification Settings')}
          </CardTitle>
          <CardDescription>{t('settings.notifications.description', 'Choose what notifications you receive')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings.notifications.enable', 'Enable Notifications')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.notifications.description', 'Receive notifications for messages, tasks, sessions, and updates')}
              </p>
            </div>
            <Switch 
              checked={notificationsEnabled} 
              onCheckedChange={handleNotificationToggle}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={fetchPlatformSettings} disabled={saving}>
          {t('common.buttons.cancel')}
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('common.messages.loading')}
            </>
            ) : (
            t('common.buttons.save')
          )}
        </Button>
      </div>
    </div>
  );
}

export default function AdminSettings() {
  const { data: session } = useSession();
  const t = useTranslation();
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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

          // Load notification preference from database
          if (data.user.notificationsEnabled !== undefined) {
            setNotificationsEnabled(data.user.notificationsEnabled !== false);
            // Also sync to localStorage for backward compatibility
            localStorage.setItem('notificationsEnabled', (data.user.notificationsEnabled !== false).toString());
          } else {
            // Fallback to localStorage if database doesn't have it yet
            const savedNotificationPreference = localStorage.getItem('notificationsEnabled');
            if (savedNotificationPreference !== null) {
              setNotificationsEnabled(savedNotificationPreference === 'true');
            }
          }
        } else {
          toast.error(t('common.messages.loadFailed', 'Failed to load admin data'));
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast.error(t('common.messages.loadFailed', 'Failed to load admin data'));
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
      toast.error(t('settings.profile.selectValidImage', 'Please select a valid image file'));
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('settings.profile.imageSizeTooLarge', 'Image size must be less than 5MB'));
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
      toast.error(t('settings.profile.selectImageFile', 'Please select an image file'));
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

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        let errorMessage = t('settings.profile.avatarUploadFailed', 'Failed to upload avatar');
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `${t('settings.profile.avatarUploadFailed', 'Failed to upload avatar')} (${response.status})`;
        }
        toast.error(errorMessage);
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success(t('settings.profile.avatarUploaded', 'Avatar uploaded successfully!'));
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
        toast.error(data.error || t('settings.profile.avatarUploadFailed', 'Failed to upload avatar'));
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || t('settings.profile.avatarUploadFailed', 'Failed to upload avatar'));
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
        toast.success(t('settings.profile.avatarRemoved', 'Avatar removed successfully!'));
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
        toast.error(data.error || t('settings.profile.avatarRemoveFailed', 'Failed to remove avatar'));
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error(t('settings.profile.avatarRemoveFailed', 'Failed to remove avatar'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle notification toggle
  const handleNotificationToggle = async (enabled) => {
    setNotificationsEnabled(enabled);
    
    try {
      // Save notification preference to database
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          notificationsEnabled: enabled
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Also save to localStorage for backward compatibility
        localStorage.setItem('notificationsEnabled', enabled.toString());
        
        toast.success(
          enabled ? t('settings.notifications.enabled', 'Notifications enabled') : t('settings.notifications.disabled', 'Notifications disabled'),
          {
            description: enabled 
              ? t('settings.notifications.enabledDescription', "You'll receive notifications for messages, tasks, and sessions")
              : t('settings.notifications.disabledDescription', "You won't receive any notifications")
          }
        );
      } else {
        throw new Error(data.error || t('settings.notifications.saveFailed', 'Failed to save notification preference'));
      }
    } catch (error) {
      console.error('Error saving notification preference:', error);
      toast.error(t('settings.notifications.saveFailed', 'Failed to save notification preference'));
      // Revert state on error
      setNotificationsEnabled(!enabled);
    }
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!session?.user?.id) {
      toast.error(t('common.messages.mustBeLoggedIn', 'You must be logged in to save changes'));
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
        toast.success(t('settings.profile.profileUpdated', 'Profile updated successfully!'));
        // Update admin data with new values
        setAdminData(prev => ({
          ...prev,
          name: formData.fullName.trim(),
          email: formData.email,
          phone: formData.phone
        }));
      } else {
        toast.error(data.error || t('settings.profile.profileUpdateFailed', 'Failed to update profile'));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('settings.profile.profileUpdateFailed', 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('navigation.settings')}</h1>
        <p className="text-muted-foreground">
          {t('settings.title')}
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-muted">
          <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            {t('profile.title')}
          </TabsTrigger>
          <TabsTrigger value="platform" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            {t('settings.general.title')}
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            <Card className="card-standard">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  {t('profile.personalInfo')}
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
                        {avatarPreview ? t('settings.profile.changePhoto', 'Change Photo') : t('settings.profile.uploadPhoto', 'Upload Photo')}
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
                                {t('common.messages.loading')}
                              </>
                            ) : (
                              t('common.buttons.save')
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
                          {t('common.buttons.remove')}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('settings.profile.avatarFormat', 'JPG, PNG or WebP. Max 5MB.')}
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="fullName">{t('common.labels.name')}</Label>
                  <Input 
                    id="fullName" 
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    disabled={loading}
                    placeholder={t('common.labels.name')}
                  />
                </div>

                <div>
                  <Label htmlFor="email">{t('common.labels.email')}</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={loading}
                    placeholder={t('common.labels.email')}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">{t('common.labels.phone')}</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={loading}
                    placeholder={t('common.labels.phone')}
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleSaveChanges}
                  disabled={loading || saving}
                >
                  {saving ? t('common.messages.loading') : t('common.buttons.saveChanges')}
                </Button>
              </CardContent>
            </Card>
            
            {/* Two-Factor Authentication Settings */}
            <TwoFactorSettings />
          </div>
          
        </TabsContent>

        {/* Platform Settings */}
        <TabsContent value="platform">
          <PlatformSettingsTab 
            notificationsEnabled={notificationsEnabled}
            handleNotificationToggle={handleNotificationToggle}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}