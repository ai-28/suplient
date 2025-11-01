"use client"

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { ArrowLeft, MessageSquare, FileText, ClipboardList, User, Mail, Phone, Calendar, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/app/components/PageHeader";
import { CoachChatTab } from "@/app/components/admin/CoachChatTab";
import { CoachNotesTab } from "@/app/components/admin/CoachNotesTab";
import { CoachTasksTab } from "@/app/components/admin/CoachTasksTab";

export default function CoachDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const coachId = params.id;
  const tabFromQuery = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromQuery || "overview");
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoachDetails();
  }, [coachId]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'chat', 'notes', 'tasks'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const fetchCoachDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/coaches?id=${coachId}`);
      const data = await response.json();
      
      if (data.success && data.coach) {
        setCoach(data.coach);
      } else {
        toast.error('Failed to load coach details');
        router.push('/admin/coaches');
      }
    } catch (error) {
      console.error('Error fetching coach details:', error);
      toast.error('Error loading coach details');
      router.push('/admin/coaches');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading coach details...</p>
        </div>
      </div>
    );
  }

  if (!coach) {
    return null;
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/coaches')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <PageHeader 
              title={coach.name || 'Coach Details'} 
              subtitle="Manage coach communication, notes, and tasks"
            />
          </div>
        </div>
      </div>

      {/* Coach Info Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{coach.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{coach.email}</p>
              </div>
            </div>
            {coach.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{coach.phone}</p>
                </div>
              </div>
            )}
          </div>
          {coach.clients !== undefined && (
            <div className="mt-4 pt-4 border-t flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Active Clients</p>
                <p className="font-medium">{coach.clients} client{coach.clients !== 1 ? 's' : ''}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="notes">
            <FileText className="h-4 w-4 mr-2" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <ClipboardList className="h-4 w-4 mr-2" />
            Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Coach Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Coach Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{coach.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{coach.email}</span>
                    </div>
                    {coach.phone && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium">{coach.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`font-medium ${coach.status === 'Active' ? 'text-green-600' : 'text-gray-600'}`}>
                        {coach.status}
                      </span>
                    </div>
                    {coach.clients !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Active Clients:</span>
                        <span className="font-medium">{coach.clients}</span>
                      </div>
                    )}
                    {coach.joinDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Joined:</span>
                        <span className="font-medium">
                          {new Date(coach.joinDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {coach.bio && (
                  <div>
                    <h3 className="font-semibold mb-2">Biography</h3>
                    <p className="text-sm text-muted-foreground">{coach.bio}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <CoachChatTab coachId={coachId} coachName={coach.name} />
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <CoachNotesTab coachId={coachId} coachName={coach.name} />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <CoachTasksTab coachId={coachId} coachName={coach.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
