"use client"

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Plus, Search, MoreHorizontal, Edit, Trash2, MessageSquare, User, Mail, Phone, Calendar, DollarSign, Users, Award } from "lucide-react";
import { Input } from "@/app/components/ui/input";
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

export default function AdminCoaches() {
  const [coaches, setCoaches] = useState([
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      email: "sarah@example.com",
      phone: "+1 555-0123",
      specialization: "Anxiety & Depression",
      experience: "8",
      qualifications: "PhD in Clinical Psychology",
      bio: "Specialized in cognitive behavioral therapy with over 8 years of experience.",
      clients: 12,
      status: "Active",
      joinDate: "2024-01-15"
    },
    {
      id: 2,
      name: "Michael Chen",
      email: "michael@example.com",
      phone: "+1 555-0124",
      specialization: "Trauma Therapy",
      experience: "6",
      qualifications: "LCSW, Trauma-Informed Care Certification",
      bio: "Expert in trauma recovery and PTSD treatment using evidence-based approaches.",
      clients: 8,
      status: "Active",
      joinDate: "2024-02-20"
    },
    {
      id: 3,
      name: "Dr. Emily Rodriguez",
      email: "emily@example.com",
      phone: "+1 555-0125",
      specialization: "Family Counseling",
      experience: "12",
      qualifications: "PhD in Family Therapy, Licensed Marriage Counselor",
      bio: "Dedicated to helping families build stronger relationships and communication.",
      clients: 15,
      status: "Pending",
      joinDate: "2024-03-10"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState(null);

  const filteredCoaches = coaches.filter(coach =>
    coach.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCoach = (newCoach) => {
    setCoaches([...coaches, newCoach]);
  };

  const handleUpdateCoach = (updatedCoach) => {
    setCoaches(coaches.map(coach => 
      coach.id === updatedCoach.id ? updatedCoach : coach
    ));
  };

  const handleDeleteCoach = (coachId) => {
    setCoaches(coaches.filter(coach => coach.id !== coachId));
    setShowDeleteDialog(false);
    setSelectedCoach(null);
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
      </div>

      {/* Coaches Summary List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredCoaches.map((coach) => (
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
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditClick(coach); }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Message
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

              {/* Professional Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Award className="h-4 w-4 mr-2" />
                    Professional Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Specialization</p>
                      <p className="font-medium">{selectedCoach.specialization}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Experience</p>
                      <p className="font-medium">{selectedCoach.experience} years</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-muted-foreground">Qualifications</p>
                    <p className="font-medium">{selectedCoach.qualifications}</p>
                  </div>
                </div>

                {selectedCoach.bio && (
                  <div>
                    <h4 className="font-semibold mb-2">Biography</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedCoach.bio}</p>
                  </div>
                )}
              </div>
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
              Are you sure you want to delete {selectedCoach?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedCoach && handleDeleteCoach(selectedCoach.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}