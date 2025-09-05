"use client"

import React, { useState } from 'react';
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

export default function Programs() {
  const router = useRouter();
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [enrolledMembersDialogOpen, setEnrolledMembersDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [newProgramName, setNewProgramName] = useState('');

  const handleDuplicate = async () => {
    if (!selectedProgram || !newProgramName.trim()) return;
    
    try {
      await duplicateProgram(selectedProgram.id, newProgramName);
      setDuplicateDialogOpen(false);
      setNewProgramName('');
      setSelectedProgram(null);
    } catch (error) {
      console.error('Failed to duplicate program:', error);
    }
  };

  const handleDelete = async (programId) => {
    try {
      await deleteProgram(programId);
    } catch (error) {
      console.error('Failed to delete program:', error);
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

  const stats = {
    totalPrograms: 10,
    clientsEnrolled: 100,
    clientsCompleted: 80,
    totalElements: 1000,
    timeSavedHours: 100
  };
  const programs = [
    {
      id: 1,
      name: "Program 1",
      description: "Program 1 description",
      duration: 10,
      elements: 100,
      isTemplate: false
    },
    {
      id: 2,
      name: "Program 2",
      description: "Program 2 description",
      duration: 15,
      elements: 150,
      isTemplate: true
    },
    { 
      id: 3,
      name: "Program 3",
      description: "Program 3 description",
      duration: 20,
      elements: 200,
      isTemplate: false
    }
  ];
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
                      {program.isTemplate && (
                        <Badge variant="secondary">Template</Badge>
                      )}
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
                    <p className="text-sm font-semibold">{program.duration} days</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Elements</p>
                    <p className="text-sm font-semibold">{program.elements.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Enrolled</p>
                    <p className="text-sm font-semibold">{clientCount}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => router.push(`/coach/programs/${program.id}/edit`)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-2" />
                      Edit Program
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const enrolledClients = getEnrolledClients(program.id);
                      setSelectedProgram(program);
                      setEnrolledMembersDialogOpen(true);
                    }}
                  >
                    <Users className="h-3 w-3" />
                  </Button>
                  
                  <Dialog open={duplicateDialogOpen && selectedProgram?.id === program.id} onOpenChange={setDuplicateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedProgram(program);
                          setNewProgramName(`${program.name} (Copy)`);
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
                        <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleDuplicate}>
                          Create Copy
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  {!program.isTemplate && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
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
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {programs.length === 0 && (
        <Card className="p-8 text-center">
          <CardContent>
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Programs</h3>
            <p className="text-muted-foreground mb-4">
              Create your first program
            </p>
            <Button onClick={() => router.push('/coach/programs/create')}>
              <Plus className="h-4 w-4 mr-2" />
                Create Program
            </Button>
          </CardContent>
        </Card>
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