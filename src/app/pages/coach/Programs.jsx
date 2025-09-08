"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users, Target, Clock, Copy, Edit, CheckCircle, Timer, Trash2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/app/components/ui/alert-dialog';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { PageHeader } from '@/app/components/PageHeader';
import { StatsCard } from '@/app/components/StatsCard';
import EnrolledMembersDialog from '@/app/components/EnrolledMembersDialog';
import { toast } from 'sonner';

export default function Programs() {
  const router = useRouter();
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [enrolledMembersDialogOpen, setEnrolledMembersDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [newProgramName, setNewProgramName] = useState('');
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState(null);
  
  // Data fetching states
  const [programs, setPrograms] = useState([]);
  const [stats, setStats] = useState({
    totalPrograms: 0,
    clientsEnrolled: 0,
    clientsCompleted: 0,
    totalElements: 0,
    timeSavedHours: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch programs data
  const fetchPrograms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/programs');
      if (!response.ok) {
        throw new Error('Failed to fetch programs');
      }
      
      const data = await response.json();
      setPrograms(data.programs || []);
      setStats({
        totalPrograms: data.stats?.totalPrograms || 0,
        clientsEnrolled: 0, // Default value - not provided by backend yet
        clientsCompleted: 0, // Default value - not provided by backend yet
        totalElements: data.programs?.reduce((sum, program) => sum + Number(program.elementCount || 0), 0) || 0,
        timeSavedHours: 0 // Default value - not provided by backend yet
      });
    } catch (err) {
      console.error('Error fetching programs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load programs on component mount
  useEffect(() => {
    fetchPrograms();
  }, []);

  const duplicateProgram = async (programId, newName) => {
    try {
      const response = await fetch(`/api/programs/${programId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newName })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to duplicate program');
      }

      const result = await response.json();
      // Refresh the programs list
      await fetchPrograms();
      toast.success('Program duplicated successfully!');
      return result;
    } catch (error) {
      console.error('Error duplicating program:', error);
      throw error;
    }
  };

  const handleDuplicate = async () => {
    if (!selectedProgram || !newProgramName.trim()) return;
    
    try {
      setIsDuplicating(true);
      await duplicateProgram(selectedProgram.id, newProgramName);
      setDuplicateDialogOpen(false);
      setNewProgramName('');
      setSelectedProgram(null);
    } catch (error) {
      console.error('Failed to duplicate program:', error);
      toast.error(error.message || 'Failed to duplicate program');
    } finally {
      setIsDuplicating(false);
    }
  };

  const deleteProgram = async (programId) => {
    try {
      const response = await fetch(`/api/programs/${programId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete program');
      }

      // Refresh the programs list
      await fetchPrograms();
      toast.success('Program deleted successfully!');
    } catch (error) {
      console.error('Error deleting program:', error);
      throw error;
    }
  };

  const handleDelete = async (programId) => {
    try {
      await deleteProgram(programId);
    } catch (error) {
      console.error('Failed to delete program:', error);
      toast.error(error.message || 'Failed to delete program');
    }
  };

  const handleEditProgram = async (programId) => {
    try {
      setEditingProgramId(programId);
      // Small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      router.push(`/coach/programs/${programId}/edit`);
    } catch (error) {
      console.error('Failed to navigate to edit program:', error);
      toast.error('Failed to open program editor');
    } finally {
      setEditingProgramId(null);
    }
  };

  // Mock enrolled clients data - in real app this would come from the backend
  const getEnrolledClients = (programId) => {
    return [
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        avatar: '',
        enrolledDate: new Date('2024-01-15'),
        progress: {
          completedElements: 8,
          totalElements: 20,
          currentDay: 12,
          status: 'on-track'
        }
      },
      {
        id: '2',
        name: 'Michael Chen',
        email: 'michael.chen@email.com',
        avatar: '',
        enrolledDate: new Date('2024-01-20'),
        progress: {
          completedElements: 15,
          totalElements: 20,
          currentDay: 18,
          status: 'ahead'
        }
      },
      {
        id: '3',
        name: 'Emily Davis',
        email: 'emily.davis@email.com',
        avatar: '',
        enrolledDate: new Date('2024-01-10'),
        progress: {
          completedElements: 5,
          totalElements: 20,
          currentDay: 15,
          status: 'behind'
        }
      }
    ];
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader 
        title={"Programs"} 
        subtitle={"Manage your programs"}
      >
        <Button onClick={() => router.push('/coach/programs/create')} className="bg-gradient-primary text-white shadow-medium hover:shadow-strong transition-all flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Program
        </Button>
      </PageHeader>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatsCard
          title={"Total Programs"}
          value={stats.totalPrograms}
          icon={Target}
          iconColor="bg-primary"
        />
        
        <StatsCard
          title={"Clients Enrolled"}
          value={stats.clientsEnrolled}
          icon={Users}
          iconColor="bg-blue-500"
        />
        
        <StatsCard
          title={"Clients Completed"}
          value={stats.clientsCompleted}
          icon={CheckCircle}
          iconColor="bg-green-500"
        />
        
        <StatsCard
          title={"Total Elements"}
          value={stats.totalElements}
          icon={Target}
          iconColor="bg-purple-500"
        />
        
        <StatsCard
          title={"Time Saved"}
          value={`${stats.timeSavedHours}h`}
          icon={Timer}
          iconColor="bg-orange-500"
        />
      </div>

      {/* Programs Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading programs...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Programs</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchPrograms} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      ) : programs.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Programs Yet</h3>
            <p className="text-muted-foreground mb-4">Create your first program to get started</p>
          </div>
        </div>
      ) : (
        <div className="grid-responsive">
          {programs.map((program) => {
          const enrolledClients = getEnrolledClients(program.id);
          const clientCount = enrolledClients.length;
          
          return (
            <Card key={program.id} className="card-hover">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{program.name}</CardTitle>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <CardDescription className="text-sm line-clamp-2">
                  {program.description}
                </CardDescription>
                
                <div className="grid grid-cols-3 gap-4 text-center py-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm font-semibold">{program.duration} weeks</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Elements</p>
                    <p className="text-sm font-semibold">{program.elementCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Enrolled</p>
                    <p className="text-sm font-semibold">{clientCount}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 flex-wrap">
                  <Button
                    size="sm"
                    onClick={() => handleEditProgram(program.id)}
                    disabled={editingProgramId === program.id}
                    className="flex-1 flex items-center gap-2"
                  >
                    {editingProgramId === program.id ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        Opening...
                      </>
                    ) : (
                      <>
                        <Edit className="h-3 w-3" />
                        Edit Program
                      </>
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => {
                      const enrolledClients = getEnrolledClients(program.id);
                      setSelectedProgram(program);
                      setEnrolledMembersDialogOpen(true);
                    }}
                  >
                    <Users className="h-3 w-3" />
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                        onClick={() => {
                          setSelectedProgram(program);
                          setNewProgramName(`${program.name} (Copy)`);
                          setDuplicateDialogOpen(true);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Duplicate Program</DialogTitle>
                        <DialogDescription>
                          Duplicate {selectedProgram?.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="program-name">Program Name</Label>
                          <Input
                            id="program-name"
                            value={newProgramName}
                            onChange={(e) => setNewProgramName(e.target.value)}
                            placeholder="Enter Program Name"
                            className="mt-2"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setDuplicateDialogOpen(false)}
                          disabled={isDuplicating}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleDuplicate}
                          disabled={isDuplicating}
                          className="flex items-center gap-2"
                        >
                          {isDuplicating && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          )}
                          {isDuplicating ? 'Creating Copy...' : 'Create Copy'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          Delete Program
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Delete {program.name}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(program.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Program
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
        </div>
      )}


      {/* Enrolled Members Dialog */}
      <EnrolledMembersDialog
        isOpen={enrolledMembersDialogOpen}
        onClose={() => setEnrolledMembersDialogOpen(false)}
        programName={selectedProgram?.name || ''}
        enrolledClients={selectedProgram ? getEnrolledClients(selectedProgram.id) : []}
      />
    </div>
  );
}