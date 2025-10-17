"use client"

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  User,
  Loader2,
  Ban
} from "lucide-react";
import { toast } from "sonner";

export default function AdminClients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [coachFilter, setCoachFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [suspending, setSuspending] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    coachId: "",
    notes: ""
  });

  // Fetch clients and coaches from API
  useEffect(() => {
    fetchClients();
    fetchCoaches();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/clients');
      const data = await response.json();
      
      if (data.success) {
        setClients(data.clients);
        if (data.clients.length > 0) {
          toast.success('Clients loaded successfully!', {
            description: `Found ${data.clients.length} client${data.clients.length === 1 ? '' : 's'}.`
          });
        }
      } else {
        console.error('Failed to fetch clients:', data.error);
        toast.error('Failed to load clients', {
          description: data.error
        });
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Error loading clients', {
        description: 'Please refresh the page to try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCoaches = async () => {
    try {
      const response = await fetch('/api/admin/assigned-coaches');
      const data = await response.json();
      
      if (data.success) {
        setCoaches(data.coaches);
      } else {
        console.error('Failed to fetch coaches:', data.error);
      }
    } catch (error) {
      console.error('Error fetching coaches:', error);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCoach = !coachFilter || coachFilter === "all" || client.coachId === coachFilter;
    return matchesSearch && matchesCoach;
  });

  const handleCreate = async () => {
    try {
      setCreating(true);
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Add the new client to the list
        setClients([...clients, data.client]);
        setIsCreateOpen(false);
        setFormData({ name: "", email: "", phone: "", location: "", coachId: "", notes: "" });
        toast.success('Client created successfully!', {
          description: `${data.client.name} has been added to the platform.`
        });
      } else {
        console.error('Failed to create client:', data.error);
        toast.error('Failed to create client', {
          description: data.error
        });
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Error creating client', {
        description: 'Please try again.'
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async () => {
    if (selectedClient) {
      try {
        const response = await fetch('/api/admin/clients', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: selectedClient.id,
            ...formData
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Update the client in the list
          setClients(clients.map(client => 
            client.id === selectedClient.id ? data.client : client
          ));
          setIsEditOpen(false);
          setSelectedClient(null);
          setFormData({ name: "", email: "", phone: "", location: "", coachId: "", notes: "" });
          toast.success('Client updated successfully!', {
            description: `${data.client.name}'s profile has been updated.`
          });
        } else {
          console.error('Failed to update client:', data.error);
          toast.error('Failed to update client', {
            description: data.error
          });
        }
      } catch (error) {
        console.error('Error updating client:', error);
        toast.error('Error updating client', {
          description: 'Please try again.'
        });
      }
    }
  };

  const handleDelete = async (clientId) => {
    try {
      const response = await fetch(`/api/admin/clients?id=${clientId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Remove the client from the list
        setClients(clients.filter(client => client.id !== clientId));
        toast.success('Client deleted successfully!', {
          description: data.message
        });
      } else {
        console.error('Failed to delete client:', data.error);
        toast.error('Failed to delete client', {
          description: data.error
        });
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Error deleting client', {
        description: 'Please try again.'
      });
    }
  };

  const handleSuspend = async (clientId, currentStatus) => {
    try {
      setSuspending(true);
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const action = newStatus === 'inactive' ? 'suspend' : 'activate';
      
      const response = await fetch('/api/admin/clients', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: clientId,
          status: newStatus
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the client in the list
        setClients(clients.map(client => 
          client.id === clientId ? { ...client, status: newStatus } : client
        ));
        toast.success(`Client ${action}ed successfully!`, {
          description: `Client status changed to ${newStatus}.`
        });
      } else {
        console.error(`Failed to ${action} client:`, data.error);
        toast.error(`Failed to ${action} client`, {
          description: data.error
        });
      }
    } catch (error) {
      console.error(`Error ${action}ing client:`, error);
      toast.error(`Error ${action}ing client`, {
        description: 'Please try again.'
      });
    } finally {
      setSuspending(false);
    }
  };

  const openEditDialog = (client) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      location: client.location,
      coachId: client.coachId,
      notes: client.notes
    });
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Management</h1>
          <p className="text-muted-foreground">
            Manage all clients in the platform
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Client</DialogTitle>
              <DialogDescription>
                Add a new client to the platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="coach">Assigned Coach</Label>
                  <Select value={formData.coachId} onValueChange={(value) => setFormData({...formData, coachId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a coach" />
                    </SelectTrigger>
                    <SelectContent>
                      {coaches.map((coach) => (
                        <SelectItem key={coach.id} value={coach.id}>
                          {coach.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!formData.name || !formData.email || !formData.coachId || creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Client'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={coachFilter || undefined} onValueChange={setCoachFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by coach" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All coaches</SelectItem>
            {coaches.map((coach) => (
              <SelectItem key={coach.id} value={coach.id}>
                {coach.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Coach</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead>Sessions</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <p className="text-muted-foreground">Loading clients...</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>{client.coachName}</TableCell>
                  <TableCell>
                    <Badge variant={client.status === "active" ? "default" : "secondary"}>
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{client.location}</TableCell>
                  <TableCell>{new Date(client.joinDate).toLocaleDateString()}</TableCell>
                  <TableCell>{client.sessionsCount}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(client)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuspend(client.id, client.status)}
                        disabled={suspending}
                        className={client.status === "active" ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                      >
                        {suspending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Ban className="h-3 w-3" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the client
                              and remove their data from the platform.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(client.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update client information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-coach">Assigned Coach</Label>
                <Select value={formData.coachId} onValueChange={(value) => setFormData({...formData, coachId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a coach" />
                  </SelectTrigger>
                  <SelectContent>
                    {coaches.map((coach) => (
                      <SelectItem key={coach.id} value={coach.id}>
                        {coach.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes || ""}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!formData.name || !formData.email || !formData.coachId}>
              Update Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}