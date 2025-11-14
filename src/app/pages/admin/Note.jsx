"use client"

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
import { PageHeader } from "@/app/components/PageHeader";
import { Bell, Send, Users, User, Loader2 } from "lucide-react";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { useTranslation } from "@/app/context/LanguageContext";

export default function AdminNote() {
  const { data: session } = useSession();
  const t = useTranslation();
  const [clients, setClients] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [selectedCoaches, setSelectedCoaches] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [showClients, setShowClients] = useState(true);
  const [showCoaches, setShowCoaches] = useState(true);

  // Fetch clients and coaches
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchingData(true);

        // Fetch clients
        const clientsResponse = await fetch('/api/admin/clients');
        const clientsData = await clientsResponse.json();
        if (clientsData.success) {
          setClients(clientsData.clients || []);
        }

        // Fetch coaches
        const coachesResponse = await fetch('/api/admin/coaches');
        const coachesData = await coachesResponse.json();
        if (coachesData.success) {
          setCoaches(coachesData.coaches || []);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(t('common.messages.error'));
      } finally {
        setFetchingData(false);
      }
    };

    if (session?.user?.id) {
      fetchData();
    }
  }, [session]);

  // Handle select/deselect all clients
  const handleSelectAllClients = (checked) => {
    if (checked) {
      setSelectedClients(clients.map(c => c.id));
    } else {
      setSelectedClients([]);
    }
  };

  // Handle select/deselect all coaches
  const handleSelectAllCoaches = (checked) => {
    if (checked) {
      setSelectedCoaches(coaches.map(c => c.id));
    } else {
      setSelectedCoaches([]);
    }
  };

  // Handle client selection
  const handleClientToggle = (clientId) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  // Handle coach selection
  const handleCoachToggle = (coachId) => {
    setSelectedCoaches(prev => 
      prev.includes(coachId) 
        ? prev.filter(id => id !== coachId)
        : [...prev, coachId]
    );
  };

  // Send notification
  const handleSendNotification = async () => {
    if (!message.trim()) {
      toast.error(t('notes.pleaseEnterMessage', 'Please enter a message'));
      return;
    }

    if (selectedClients.length === 0 && selectedCoaches.length === 0) {
      toast.error(t('notes.selectRecipient', 'Please select at least one recipient'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          clientIds: selectedClients,
          coachIds: selectedCoaches,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(t('notes.notificationSent', `Notification sent to ${data.recipientCount} user(s)`));
        // Reset form
        setMessage('');
        setSelectedClients([]);
        setSelectedCoaches([]);
      } else {
        throw new Error(data.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error(error.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('common.messages.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader 
        title={t('notes.sendNotification', 'Send Notification')} 
        subtitle={t('notes.sendNotificationDesc', 'Send real-time notifications to clients and coaches')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {/* Recipients Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Clients Section */}
          <Card className="card-standard">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  {t('navigation.clients')} ({selectedClients.length}/{clients.length})
                </CardTitle>
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowClients(!showClients)}
                  >
                    {showClients ? t('common.buttons.hide', 'Hide') : t('common.buttons.view', 'Show')}
                  </Button>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all-clients"
                      checked={selectedClients.length === clients.length && clients.length > 0}
                      onCheckedChange={handleSelectAllClients}
                    />
                    <Label htmlFor="select-all-clients" className="cursor-pointer">
                      {t('common.buttons.selectAll', 'Select All')}
                    </Label>
                  </div>
                </div>
              </div>
            </CardHeader>
            {showClients && (
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  {clients.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">{t('clients.noClients')}</p>
                  ) : (
                    <div className="space-y-3">
                      {clients.map((client) => (
                        <div
                          key={client.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            id={`client-${client.id}`}
                            checked={selectedClients.includes(client.id)}
                            onCheckedChange={() => handleClientToggle(client.id)}
                          />
                          <Label
                            htmlFor={`client-${client.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="font-medium">{client.name}</div>
                            <div className="text-sm text-muted-foreground">{client.email}</div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            )}
          </Card>

          {/* Coaches Section */}
          <Card className="card-standard">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  {t('navigation.coaches')} ({selectedCoaches.length}/{coaches.length})
                </CardTitle>
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCoaches(!showCoaches)}
                  >
                    {showCoaches ? t('common.buttons.hide', 'Hide') : t('common.buttons.view', 'Show')}
                  </Button>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all-coaches"
                      checked={selectedCoaches.length === coaches.length && coaches.length > 0}
                      onCheckedChange={handleSelectAllCoaches}
                    />
                    <Label htmlFor="select-all-coaches" className="cursor-pointer">
                      {t('common.buttons.selectAll', 'Select All')}
                    </Label>
                  </div>
                </div>
              </div>
            </CardHeader>
            {showCoaches && (
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  {coaches.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">{t('coaches.noCoaches')}</p>
                  ) : (
                    <div className="space-y-3">
                      {coaches.map((coach) => (
                        <div
                          key={coach.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            id={`coach-${coach.id}`}
                            checked={selectedCoaches.includes(coach.id)}
                            onCheckedChange={() => handleCoachToggle(coach.id)}
                          />
                          <Label
                            htmlFor={`coach-${coach.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="font-medium">{coach.name}</div>
                            <div className="text-sm text-muted-foreground">{coach.email}</div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Message Section */}
        <div className="lg:col-span-1">
          <Card className="card-standard sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                {t('common.labels.message', 'Message')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="message">{t('notes.notificationMessage', 'Notification Message')}</Label>
                <Textarea
                  id="message"
                  placeholder={t('notes.enterMessage', 'Enter your notification message here...')}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {message.length} {t('common.labels.characters', 'characters')}
                </p>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('notes.recipients', 'Recipients')}:</span>
                  <span className="font-medium">
                    {selectedClients.length + selectedCoaches.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('navigation.clients')}:</span>
                  <span className="font-medium">{selectedClients.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('navigation.coaches')}:</span>
                  <span className="font-medium">{selectedCoaches.length}</span>
                </div>
              </div>

              <Button
                onClick={handleSendNotification}
                disabled={loading || !message.trim() || (selectedClients.length === 0 && selectedCoaches.length === 0)}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.messages.loading')}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {t('notes.sendNotification', 'Send Notification')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

