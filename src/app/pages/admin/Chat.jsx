"use client"

import { useState } from "react";
import { useTranslation } from "@/app/context/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/app/components/ui/collapsible";
import { 
  Search, 
  MessageSquare, 
  UserCheck,
  Users,
  Megaphone,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { AdminChatInterface } from "@/app/components/AdminChatInterface";
import { useRouter } from "next/navigation";

export default function AdminChat() {
  const router = useRouter(); // Using Next.js router for navigation
  const t = useTranslation();
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCoaches, setExpandedCoaches] = useState([]);

  // Mock data
  const coaches = [
    {
      id: "1",
      name: "Coach Clausen",
      email: "sarah@example.com",
      status: "online",
      avatar: "",
      lastSeen: "Now",
      type: "coach",
      specialty: "Anxiety & Depression"
    },
    {
      id: "2",
      name: "Michael Chen",
      email: "michael@example.com",
      status: "offline",
      avatar: "",
      lastSeen: "2 hours ago",
      type: "coach",
      specialty: "Trauma Therapy"
    },
    {
      id: "3",
      name: "Lisa Rodriguez",
      email: "lisa@example.com",
      status: "online",
      avatar: "",
      lastSeen: "5 minutes ago",
      type: "coach",
      specialty: "Family Counseling"
    }
  ];

  const clients = [
    {
      id: "4",
      name: "John Smith",
      email: "john@example.com",
      status: "online",
      avatar: "",
      lastSeen: "Now",
      type: "client",
      coach: "1"
    },
    {
      id: "5",
      name: "Emily Davis",
      email: "emily@example.com",
      status: "offline",
      avatar: "",
      lastSeen: "1 hour ago",
      type: "client",
      coach: "2"
    },
    {
      id: "6",
      name: "Alex Johnson",
      email: "alex@example.com",
      status: "online",
      avatar: "",
      lastSeen: "5 min ago",
      type: "client",
      coach: "1"
    },
    {
      id: "7",
      name: "Maria Garcia",
      email: "maria@example.com",
      status: "offline",
      avatar: "",
      lastSeen: "30 min ago",
      type: "client",
      coach: "3"
    }
  ];

  const getClientsForCoach = (coachId) => {
    return clients.filter(client => client.coach === coachId);
  };

  const filteredCoaches = coaches.filter(coach =>
    coach.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleCoachExpansion = (coachId) => {
    setExpandedCoaches(prev => 
      prev.includes(coachId) 
        ? prev.filter(id => id !== coachId)
        : [...prev, coachId]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "offline":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "online":
        return "Online";
      case "offline":
        return "Offline";
      default:
        return "Unknown";
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('chat.title', 'Communication Center')}</h1>
        <p className="text-muted-foreground">
          {t('chat.communicationDesc', 'Chat with coaches and clients directly')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('chat.coachesAndClients', 'Coaches & Clients')}</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('common.buttons.search')}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {filteredCoaches.map((coach) => {
                const coachClients = getClientsForCoach(coach.id);
                const isExpanded = expandedCoaches.includes(coach.id);
                
                return (
                  <div key={coach.id} className="border-b">
                    <Collapsible
                      open={isExpanded}
                      onOpenChange={() => toggleCoachExpansion(coach.id)}
                    >
                      <div className="flex">
                        {/* Coach Row */}
                        <div
                          className={`flex-1 p-4 cursor-pointer hover:bg-muted/50 ${
                            selectedContact?.id === coach.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => setSelectedContact(coach)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar>
                                <AvatarFallback>{coach.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                              </Avatar>
                              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(coach.status)}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">{coach.name}</p>
                                <Badge variant="outline" className="text-xs">
                                  {coachClients.length} {t('navigation.clients').toLowerCase()}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{coach.specialty}</p>
                              <p className="text-xs text-muted-foreground">{getStatusText(coach.status)}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Expand/Collapse Button */}
                        {coachClients.length > 0 && (
                          <CollapsibleTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="px-3 py-1 m-2 h-auto"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        )}
                      </div>
                      
                      {/* Clients List */}
                      <CollapsibleContent>
                        {coachClients.map((client) => (
                          <div
                            key={client.id}
                            className={`pl-8 pr-4 py-3 border-t cursor-pointer hover:bg-muted/30 ${
                              selectedContact?.id === client.id ? 'bg-muted/50' : ''
                            }`}
                            onClick={() => setSelectedContact(client)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="text-xs">
                                    {client.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-background ${getStatusColor(client.status)}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{client.name}</p>
                                <p className="text-xs text-muted-foreground">{getStatusText(client.status)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              })}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2">
          {selectedContact ? (
            <AdminChatInterface
              chatId={selectedContact.id}
              participantName={selectedContact.name}
              participantInitials={selectedContact.name.split(' ').map(n => n[0]).join('')}
              participantType={selectedContact.type}
              title={selectedContact.name}
            />
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('chat.selectContact', 'Select a contact')}</h3>
                  <p className="text-muted-foreground max-w-md">
                    {t('chat.selectContactDesc', 'Choose a coach or client to start a direct conversation')}
                  </p>
                </div>
                <Button className="w-full" variant="outline">
                  <Megaphone className="h-4 w-4 mr-2" />
                  {t('chat.sendAnnouncement', 'Send System Announcement')}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}