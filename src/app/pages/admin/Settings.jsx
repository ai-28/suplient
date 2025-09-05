import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Separator } from "@/app/components/ui/separator";
import { LanguageSelector } from "@/app/components/LanguageSelector";

export default function AdminSettings() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground">
          Configure platform-wide settings and preferences.
        </p>
      </div>

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
    </div>
  );
}