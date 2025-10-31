"use client"

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Plus, Search, MoreHorizontal, Edit, Trash2, MessageSquare, User, Mail, Phone, Calendar, DollarSign, Users, LogIn, ArrowUpDown } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
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

export default function AdminCoaches() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState(false);

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
        if (data.coaches.length > 0) {
          toast.success('Coaches loaded successfully!', {
            description: `Found ${data.coaches.length} coach${data.coaches.length === 1 ? '' : 'es'}.`
          });
        }
      } else {
        console.error('Failed to fetch coaches:', data.error);
        toast.error('Failed to load coaches', {
          description: data.error
        });
      }
    } catch (error) {
      console.error('Error fetching coaches:', error);
      toast.error('Error loading coaches', {
        description: 'Please refresh the page to try again.'
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
        // Active status comes first in ascending, last in descending
        const statusA = a.status === 'Active' ? 0 : 1;
        const statusB = b.status === 'Active' ? 0 : 1;
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
    setSelectedCoach(coach);
    setShowDetailDialog(true);
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coaches Management</h1>
          <p className="text-muted-foreground">
            Manage and oversee all coaches on the platform.
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Coach
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search coaches..." 
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
                        <Badge variant={coach.status === "Active" ? "default" : "secondary"} className="text-xs">
                          {coach.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{coach.specialization}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {coach.clients} clients
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {coach.experience} years exp
                        </span>
                      </div>
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
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleLoginAs(coach); }} disabled={impersonating}>
                          <LogIn className="mr-2 h-4 w-4" />
                          {impersonating ? 'Logging in...' : 'Login as Coach'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditClick(coach); }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
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
      <AlertDialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>{selectedCoach?.name}</span>
            </AlertDialogTitle>
          </AlertDialogHeader>
          {selectedCoach && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedCoach.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedCoach.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {new Date(selectedCoach.joinDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={selectedCoach.status === "Active" ? "default" : "secondary"}>
                      {selectedCoach.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedCoach.clients} active clients</span>
                  </div>
                </div>
              </div>

              {/* Bio Information */}
              {selectedCoach.bio && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Biography</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedCoach.bio}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <Button onClick={() => { setShowDetailDialog(false); handleEditClick(selectedCoach); }}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Coach
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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