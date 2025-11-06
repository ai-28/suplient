"use client"

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Plus, Search, MoreHorizontal, Edit, Trash2, MessageSquare, User, Mail, Phone, Calendar, DollarSign, Users, LogIn, ArrowUpDown, FileText, ClipboardList, CheckCircle2, XCircle, Loader2, Eye, ExternalLink } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { CreateCoachDialog } from "@/app/components/CreateCoachDialog";
import { EditCoachDialog } from "@/app/components/EditCoachDialog";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/app/context/LanguageContext";

export default function AdminCoaches() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const t = useTranslation();
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState(false);
  const [approvingCoachId, setApprovingCoachId] = useState(null);
  const [denyingCoachId, setDenyingCoachId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name-asc"); // Default: Name A-Z
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState(null);

  // Fetch coaches from API
  useEffect(() => {
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/coaches');
      const data = await response.json();
      
      if (data.success) {
        setCoaches(data.coaches);
        // Don't show success toast on every fetch - only show errors
      } else {
        console.error('Failed to fetch coaches:', data.error);
        toast.error(t('common.messages.error'), {
          description: data.error
        });
      }
    } catch (error) {
      console.error('Error fetching coaches:', error);
      toast.error(t('common.messages.error'), {
        description: t('common.messages.pleaseWait')
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter coaches
  const filteredCoaches = coaches.filter(coach =>
    coach.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (coach.specialization && coach.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort coaches
  const sortedAndFilteredCoaches = [...filteredCoaches].sort((a, b) => {
    const [field, direction] = sortBy.split('-');
    const isAsc = direction === 'asc';
    
    switch (field) {
      case 'name':
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return isAsc 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      
      case 'clients':
        const clientsA = parseInt(a.clients) || 0;
        const clientsB = parseInt(b.clients) || 0;
        return isAsc 
          ? clientsA - clientsB
          : clientsB - clientsA;
      
      case 'email':
        const emailA = (a.email || '').toLowerCase();
        const emailB = (b.email || '').toLowerCase();
        return isAsc
          ? emailA.localeCompare(emailB)
          : emailB.localeCompare(emailA);
      
       case 'status':
         // Sort by approval status: pending first, then active, then denied
         const getStatusPriority = (coach) => {
           if (coach.approvalStatus === 'pending') return 0;
           if (coach.approvalStatus === 'approved' && coach.isActive) return 1;
           if (coach.approvalStatus === 'denied') return 2;
           return 3; // inactive
         };
         const statusA = getStatusPriority(a);
         const statusB = getStatusPriority(b);
         return isAsc
           ? statusA - statusB
           : statusB - statusA;
      
      case 'joinDate':
        const dateA = new Date(a.joinDate || 0).getTime();
        const dateB = new Date(b.joinDate || 0).getTime();
        return isAsc
          ? dateA - dateB
          : dateB - dateA;
      
      default:
        return 0;
    }
  });

  const handleCreateCoach = async (coachData) => {
    try {
      const response = await fetch('/api/admin/coaches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(coachData),
      });

      const data = await response.json();

      if (data.success) {
        // Add the new coach to the list
        setCoaches([...coaches, data.coach]);
        setShowCreateDialog(false);
        toast.success('Coach created successfully!', {
          description: `${data.coach.name} has been added to the platform.`
        });
      } else {
        console.error('Failed to create coach:', data.error);
        toast.error('Failed to create coach', {
          description: data.error
        });
      }
    } catch (error) {
      console.error('Error creating coach:', error);
      toast.error('Error creating coach', {
        description: 'Please try again.'
      });
    }
  };

  const handleUpdateCoach = async (updatedCoachData) => {
    try {
      const response = await fetch('/api/admin/coaches', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCoachData),
      });

      const data = await response.json();

      if (data.success) {
        // Update the coach in the list
        setCoaches(coaches.map(coach => 
          coach.id === updatedCoachData.id ? data.coach : coach
        ));
        setShowEditDialog(false);
        setSelectedCoach(null);
        toast.success('Coach updated successfully!', {
          description: `${data.coach.name}'s profile has been updated.`
        });
      } else {
        console.error('Failed to update coach:', data.error);
        toast.error('Failed to update coach', {
          description: data.error
        });
      }
    } catch (error) {
      console.error('Error updating coach:', error);
      toast.error('Error updating coach', {
        description: 'Please try again.'
      });
    }
  };

  const handleDeleteCoach = async (coachId) => {
    try {
      const response = await fetch(`/api/admin/coaches?id=${coachId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Remove the coach from the list
        setCoaches(coaches.filter(coach => coach.id !== coachId));
        setShowDeleteDialog(false);
        setSelectedCoach(null);
        toast.success('Coach deleted successfully!', {
          description: data.deletedClients > 0 
            ? `Coach and ${data.deletedClients} client${data.deletedClients === 1 ? '' : 's'} deleted`
            : 'Coach deleted'
        });
      } else {
        console.error('Failed to delete coach:', data.error);
        toast.error('Failed to delete coach', {
          description: data.error
        });
      }
    } catch (error) {
      console.error('Error deleting coach:', error);
      toast.error('Error deleting coach', {
        description: 'Please try again.'
      });
    }
  };

  const handleEditClick = (coach) => {
    setSelectedCoach(coach);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (coach) => {
    setSelectedCoach(coach);
    setShowDeleteDialog(true);
  };

  const handleCoachClick = (coach) => {
    // Always show modal when clicking coach item
    handleViewDetails(coach);
  };

  const handleViewDetails = (coach) => {
    setSelectedCoach(coach);
    // Use setTimeout to ensure dropdown closes before opening dialog
    setTimeout(() => {
      setShowDetailDialog(true);
    }, 100);
  };

  const handleApproveCoach = async (coach) => {
    try {
      setApprovingCoachId(coach.id);
      const response = await fetch(`/api/admin/coaches/${coach.id}/approve`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Coach approved successfully!', {
          description: `${coach.name} can now log in to the platform.`
        });
        fetchCoaches(); // Refresh the list
      } else {
        throw new Error(data.error || 'Failed to approve coach');
      }
    } catch (error) {
      console.error('Error approving coach:', error);
      toast.error('Failed to approve coach', {
        description: error.message
      });
    } finally {
      setApprovingCoachId(null);
    }
  };

  const handleDenyCoach = async (coach) => {
    try {
      setDenyingCoachId(coach.id);
      
      // Call deny endpoint which sends email and deletes the coach
      const response = await fetch(`/api/admin/coaches/${coach.id}/deny`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: null })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Coach denied and removed successfully!', {
          description: `${coach.name} has been denied access and removed from the platform.`
        });
        fetchCoaches(); // Refresh the list
      } else {
        throw new Error(data.error || 'Failed to deny coach');
      }
    } catch (error) {
      console.error('Error denying coach:', error);
      toast.error('Failed to deny coach', {
        description: error.message
      });
    } finally {
      setDenyingCoachId(null);
    }
  };

  const handleLoginAs = async (coach) => {
    try {
      setImpersonating(true);
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: coach.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update session to start impersonation
        await update({
          impersonate: {
            targetUserId: data.targetUser.id,
            targetUserRole: data.targetUser.role,
            targetUserName: data.targetUser.name,
            targetUserEmail: data.targetUser.email
          }
        });

        toast.success('Impersonation started', {
          description: `You are now viewing as ${data.targetUser.name}`
        });

        // Redirect to dashboard based on role
        if (data.targetUser.role === 'coach') {
          router.push('/coach/dashboard');
        } else if (data.targetUser.role === 'client') {
          router.push('/client/dashboard');
        }
      } else {
        throw new Error(data.error || 'Failed to start impersonation');
      }
    } catch (error) {
      console.error('Error starting impersonation:', error);
      toast.error('Failed to start impersonation', {
        description: error.message
      });
    } finally {
      setImpersonating(false);
    }
  };

  const getStatusBadge = (coach) => {
    if (coach.approvalStatus === 'pending') {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending Approval</Badge>;
    } else if (coach.approvalStatus === 'denied') {
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Denied</Badge>;
    } else if (coach.isActive) {
      return <Badge variant="default">Active</Badge>;
    } else {
      return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('coaches.title')}</h1>
          <p className="text-muted-foreground">
            {t('coaches.title')}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('coaches.addCoach')}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t('coaches.searchCoaches')} 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[200px]">
            <div className="flex items-center">
              <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Sort by..." />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="clients-desc">Most Clients</SelectItem>
            <SelectItem value="clients-asc">Fewest Clients</SelectItem>
            <SelectItem value="email-asc">Email (A-Z)</SelectItem>
            <SelectItem value="email-desc">Email (Z-A)</SelectItem>
            <SelectItem value="status-asc">Status (Active First)</SelectItem>
            <SelectItem value="status-desc">Status (Inactive First)</SelectItem>
            <SelectItem value="joinDate-desc">Newest First</SelectItem>
            <SelectItem value="joinDate-asc">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Coaches Summary List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Loading coaches...</p>
            </div>
          ) : (
            <div className="divide-y">
              {sortedAndFilteredCoaches.map((coach) => (
              <div
                key={coach.id}
                className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleCoachClick(coach)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                     <div className="flex-1">
                       <div className="flex items-center space-x-2">
                         <h3 className="font-semibold">{coach.name}</h3>
                         {getStatusBadge(coach)}
                       </div>
                       <p className="text-sm text-muted-foreground mt-1">{coach.email}</p>
                       <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                         <span className="flex items-center">
                           <Users className="h-3 w-3 mr-1" />
                           {coach.clients} clients
                         </span>
                         <span className="flex items-center">
                           <Calendar className="h-3 w-3 mr-1" />
                           {new Date(coach.joinDate).toLocaleDateString()}
                         </span>
                       </div>
                       {coach.approvalStatus === 'pending' && (
                         <div className="mt-3 flex items-center gap-2">
                           <Button
                             size="sm"
                             variant="default"
                             onClick={(e) => {
                               e.stopPropagation();
                               handleApproveCoach(coach);
                             }}
                             disabled={approvingCoachId === coach.id || denyingCoachId === coach.id}
                             className="h-7"
                           >
                             {approvingCoachId === coach.id ? (
                               <>
                                 <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                 Approving...
                               </>
                             ) : (
                               <>
                                 <CheckCircle2 className="h-3 w-3 mr-1" />
                                 Approve
                               </>
                             )}
                           </Button>
                           <Button
                             size="sm"
                             variant="destructive"
                             onClick={(e) => {
                               e.stopPropagation();
                               handleDenyCoach(coach);
                             }}
                             disabled={approvingCoachId === coach.id || denyingCoachId === coach.id}
                             className="h-7"
                           >
                             {denyingCoachId === coach.id ? (
                               <>
                                 <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                 Denying...
                               </>
                             ) : (
                               <>
                                 <XCircle className="h-3 w-3 mr-1" />
                                 Deny
                               </>
                             )}
                           </Button>
                         </div>
                       )}
                     </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => {
                          handleViewDetails(coach);
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {coach.approvalStatus !== 'pending' && (
                          <DropdownMenuItem onClick={(e) => { 
                            e.stopPropagation(); 
                            router.push(`/admin/coaches/${coach.id}`); 
                          }}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Full Profile
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/admin/coaches/${coach.id}?tab=chat`); }}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Chat
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/admin/coaches/${coach.id}?tab=notes`); }}>
                          <FileText className="mr-2 h-4 w-4" />
                          Notes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/admin/coaches/${coach.id}?tab=tasks`); }}>
                          <ClipboardList className="mr-2 h-4 w-4" />
                          Tasks
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleLoginAs(coach); }} disabled={impersonating || coach.approvalStatus === 'pending' || coach.approvalStatus === 'denied'}>
                          <LogIn className="mr-2 h-4 w-4" />
                          {impersonating ? 'Logging in...' : 'Login as Coach'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); handleDeleteClick(coach); }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateCoachDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateCoach={handleCreateCoach}
      />

      <EditCoachDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onUpdateCoach={handleUpdateCoach}
        coach={selectedCoach}
      />

      {/* Coach Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent 
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>{selectedCoach?.name}</span>
              </div>
              {selectedCoach && getStatusBadge(selectedCoach)}
            </DialogTitle>
            <DialogDescription>
              {selectedCoach?.approvalStatus === 'pending' 
                ? 'Review the coach application and questionnaire responses below'
                : selectedCoach?.approvalStatus === 'denied'
                ? 'Coach application was denied'
                : 'Coach profile information'}
            </DialogDescription>
          </DialogHeader>
          {selectedCoach && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <span>{selectedCoach.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Phone:</span>
                    <span>{selectedCoach.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Joined:</span>
                    <span>{new Date(selectedCoach.joinDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-medium">Status:</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Clients:</span>
                    <span>{selectedCoach.clients} active clients</span>
                  </div>
                </div>
              </div>

              {/* Questionnaire Information (show for all coaches if available) */}
              {(selectedCoach.expectedPlatformBestAt || selectedCoach.currentClientsPerMonth !== null || selectedCoach.currentPlatform) && (
                <div className="space-y-4 border-b pb-4">
                  <h4 className="font-semibold text-lg">Application Questionnaire</h4>
                  <div className="space-y-4">
                    {selectedCoach.expectedPlatformBestAt && (
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm font-semibold mb-2 text-primary">What do you expect this platform to be the best at?</p>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{selectedCoach.expectedPlatformBestAt}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {selectedCoach.currentClientsPerMonth !== null && selectedCoach.currentClientsPerMonth !== undefined && (
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <p className="text-sm font-semibold mb-1">Current clients per month</p>
                          <p className="text-sm text-muted-foreground">{selectedCoach.currentClientsPerMonth}</p>
                        </div>
                      )}
                      {selectedCoach.currentPlatform && (
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <p className="text-sm font-semibold mb-1">Current platform</p>
                          <p className="text-sm text-muted-foreground">{selectedCoach.currentPlatform}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

               {/* Bio Information */}
               {selectedCoach.bio && (
                 <div className="space-y-4 border-t pt-4">
                   <div>
                     <h4 className="font-semibold mb-2">Biography</h4>
                     <p className="text-sm text-muted-foreground leading-relaxed">{selectedCoach.bio}</p>
                   </div>
                 </div>
               )}

              {/* Approve/Deny Actions for Pending Coaches */}
              {selectedCoach.approvalStatus === 'pending' && (
                <div className="flex items-center gap-2 border-t pt-4">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDetailDialog(false);
                      handleApproveCoach(selectedCoach);
                    }}
                    disabled={approvingCoachId === selectedCoach.id || denyingCoachId === selectedCoach.id}
                    className="flex-1"
                  >
                    {approvingCoachId === selectedCoach.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve Coach
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDetailDialog(false);
                      handleDenyCoach(selectedCoach);
                    }}
                    disabled={approvingCoachId === selectedCoach.id || denyingCoachId === selectedCoach.id}
                    className="flex-1"
                  >
                    {denyingCoachId === selectedCoach.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Denying...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Deny Coach
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
            {selectedCoach?.approvalStatus !== 'pending' && (
              <Button onClick={() => { setShowDetailDialog(false); handleEditClick(selectedCoach); }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Coach
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coach</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCoach?.name}? 
              {selectedCoach?.clients > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  ⚠️ This will also delete {selectedCoach.clients} associated client{selectedCoach.clients === 1 ? '' : 's'}.
                </span>
              )}
              <span className="block mt-2">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedCoach && handleDeleteCoach(selectedCoach.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Coach{selectedCoach?.clients > 0 ? ' & Clients' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

