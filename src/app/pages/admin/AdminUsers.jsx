"use client"

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { PageHeader } from "@/app/components/PageHeader";
import { UserCog, Mail, Shield, UserPlus, Edit, Trash2, Crown, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Checkbox } from "@/app/components/ui/checkbox";
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

export default function AdminUsers() {
  const { data: session } = useSession();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserIsSuperAdmin, setCurrentUserIsSuperAdmin] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [updatingAdmin, setUpdatingAdmin] = useState(false);
  const [deletingAdmin, setDeletingAdmin] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    isSuperAdmin: false,
    isActive: true,
  });
  const [showPasswordEdit, setShowPasswordEdit] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/admins');
        const data = await response.json();
        
        if (data.success) {
          setAdmins(data.admins || []);
          // Check if current user is super admin
          const currentUser = data.admins.find(a => a.id === session?.user?.id);
          setCurrentUserIsSuperAdmin(currentUser?.isSuperAdmin || false);
        } else {
          toast.error('Failed to load admin users');
        }
      } catch (error) {
        console.error('Error fetching admins:', error);
        toast.error('Failed to load admin users');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchAdmins();
    }
  }, [session]);

  const handleCreateAdmin = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setCreatingAdmin(true);

    try {
      const response = await fetch('/api/admin/admins/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Admin created successfully');
        setShowCreateDialog(false);
        setFormData({ name: '', email: '', password: '', phone: '', isSuperAdmin: false, isActive: true });
        // Refresh admins list
        const refreshResponse = await fetch('/api/admin/admins');
        const refreshData = await refreshResponse.json();
        if (refreshData.success) {
          setAdmins(refreshData.admins || []);
        }
      } else {
        toast.error(data.error || 'Failed to create admin');
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      toast.error('Failed to create admin');
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleUpdateAdmin = async () => {
    if (!selectedAdmin) return;

    // Check if user is updating their own account
    const isUpdatingSelf = selectedAdmin.id === session?.user?.id;

    // Validate password changes if password edit is shown
    if (showPasswordEdit) {
      // Always require current password for security verification
      if (!passwordData.currentPassword) {
        toast.error('Your current password is required to change any password');
        return;
      }

      // Check if new password is provided
      if (passwordData.newPassword || passwordData.confirmPassword) {
        if (passwordData.newPassword.length < 8) {
          toast.error('New password must be at least 8 characters long');
          return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
          toast.error('New passwords do not match');
          return;
        }
      } else {
        // If password fields are shown but empty, that's okay - just don't update password
        // Clear the password data to avoid sending empty strings
        passwordData.newPassword = '';
        passwordData.currentPassword = '';
        passwordData.confirmPassword = '';
      }
    }

    setUpdatingAdmin(true);

    try {
      const updateData = {
        ...formData,
        password: passwordData.newPassword,
        currentPassword: passwordData.currentPassword, // Always send current password for verification
      };

      const response = await fetch(`/api/admin/admins/${selectedAdmin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      // Handle error responses (400, 403, 404, 500, etc.)
      if (!response.ok || !data.success) {
        // Show specific error message from backend
        const errorMessage = data.error || 'Failed to update admin';
        
        // Special handling for password errors
        if (errorMessage.includes('password')) {
          toast.error(errorMessage, { duration: 5000 });
        } else {
          toast.error(errorMessage);
        }
        return;
      }

      // Success case
      toast.success('Admin updated successfully');
      setShowEditDialog(false);
      setSelectedAdmin(null);
      setFormData({ name: '', email: '', password: '', phone: '', isSuperAdmin: false, isActive: true });
      setShowPasswordEdit(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      // Refresh admins list
      const refreshResponse = await fetch('/api/admin/admins');
      const refreshData = await refreshResponse.json();
      if (refreshData.success) {
        setAdmins(refreshData.admins || []);
      }
    } catch (error) {
      console.error('Error updating admin:', error);
      toast.error('Network error: Failed to update admin');
    } finally {
      setUpdatingAdmin(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;

    setDeletingAdmin(true);

    try {
      const response = await fetch(`/api/admin/admins/${selectedAdmin.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Admin deleted successfully');
        setShowDeleteDialog(false);
        setSelectedAdmin(null);
        // Refresh admins list
        const refreshResponse = await fetch('/api/admin/admins');
        const refreshData = await refreshResponse.json();
        if (refreshData.success) {
          setAdmins(refreshData.admins || []);
        }
      } else {
        toast.error(data.error || 'Failed to delete admin');
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast.error('Failed to delete admin');
    } finally {
      setDeletingAdmin(false);
    }
  };

  const openEditDialog = (admin) => {
    setSelectedAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      phone: admin.phone || '',
      isSuperAdmin: admin.isSuperAdmin,
      isActive: admin.isActive,
    });
    setShowPasswordEdit(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (admin) => {
    setSelectedAdmin(admin);
    setShowDeleteDialog(true);
  };

  const canEditAdmin = (admin) => {
    // Super admins can edit anyone
    if (currentUserIsSuperAdmin) return true;
    // Regular admins cannot edit super admins
    if (admin.isSuperAdmin) return false;
    return true;
  };

  const canDeleteAdmin = (admin) => {
    // Cannot delete yourself
    if (admin.id === session?.user?.id) return false;
    // Super admins can delete anyone
    if (currentUserIsSuperAdmin) return true;
    // Regular admins cannot delete super admins
    if (admin.isSuperAdmin) return false;
    return true;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader 
        title="Admin Users" 
        subtitle={`Manage system administrators ${currentUserIsSuperAdmin ? '(Super Admin)' : '(Admin)'}`}
      >
        {currentUserIsSuperAdmin && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Admin</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Admin name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isSuperAdmin"
                    checked={formData.isSuperAdmin}
                    onCheckedChange={(checked) => setFormData({ ...formData, isSuperAdmin: checked })}
                  />
                  <Label htmlFor="isSuperAdmin" className="cursor-pointer flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-600" />
                    Make Super Admin
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Active Account
                  </Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={creatingAdmin}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAdmin} disabled={creatingAdmin}>
                  {creatingAdmin ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Admin'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      <Card className="card-standard mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            Administrators ({admins.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {/* Header Row */}
            <div className="grid grid-cols-5 gap-4 p-4 text-sm font-medium text-muted-foreground bg-muted/30 rounded-lg">
              <div>Name</div>
              <div>Email</div>
              <div>Role</div>
              <div>Status</div>
              <div>Actions</div>
            </div>

            {/* Admin Rows */}
            {admins.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No admin users found
              </div>
            ) : (
              admins.map((admin) => (
                <div 
                  key={admin.id} 
                  className="grid grid-cols-5 gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${admin.isSuperAdmin ? 'bg-yellow-100' : 'bg-primary/10'} rounded-full flex items-center justify-center`}>
                      {admin.isSuperAdmin ? (
                        <Crown className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <Shield className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{admin.name}</div>
                      {admin.id === session?.user?.id && (
                        <div className="text-xs text-muted-foreground">(You)</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {admin.email}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Badge 
                      className={`${admin.isSuperAdmin 
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-300' 
                        : 'bg-blue-100 text-blue-800 border-blue-300'
                      }`}
                    >
                      {admin.isSuperAdmin ? 'Super Admin' : 'Admin'}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <Badge 
                      className={`${admin.isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openEditDialog(admin)}
                      disabled={!canEditAdmin(admin)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openDeleteDialog(admin)}
                      disabled={!canDeleteAdmin(admin)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            
            {/* Password Update Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Password</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowPasswordEdit(!showPasswordEdit);
                    if (showPasswordEdit) {
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }
                  }}
                >
                  {showPasswordEdit ? 'Cancel' : 'Change Password'}
                </Button>
              </div>
               {showPasswordEdit && (
                 <div className="space-y-3">
                   {/* Always show current password field for security */}
                   <div className="space-y-2">
                     <Label htmlFor="current-password">
                       Your Current Password * 
                       {selectedAdmin?.id !== session?.user?.id && (
                         <span className="text-muted-foreground font-normal"> (for verification)</span>
                       )}
                     </Label>
                     <Input
                       id="current-password"
                       type="password"
                       placeholder="Enter your current password"
                       value={passwordData.currentPassword}
                       onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="new-password">
                       New Password {selectedAdmin?.id !== session?.user?.id && `for ${selectedAdmin?.name}`} *
                     </Label>
                     <Input
                       id="new-password"
                       type="password"
                       placeholder="Enter new password (min. 8 characters)"
                       value={passwordData.newPassword}
                       onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="confirm-password">Confirm New Password *</Label>
                     <Input
                       id="confirm-password"
                       type="password"
                       placeholder="Confirm new password"
                       value={passwordData.confirmPassword}
                       onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                     />
                   </div>
                   <p className="text-xs text-muted-foreground">
                     {selectedAdmin?.id === session?.user?.id 
                       ? '🔒 Enter your current password to change your password.'
                       : `🔒 Enter YOUR current password to reset ${selectedAdmin?.name}'s password.`}
                   </p>
                 </div>
               )}
            </div>
            
            {currentUserIsSuperAdmin && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-isSuperAdmin"
                  checked={formData.isSuperAdmin}
                  onCheckedChange={(checked) => setFormData({ ...formData, isSuperAdmin: checked })}
                />
                <Label htmlFor="edit-isSuperAdmin" className="cursor-pointer flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-600" />
                  Super Admin
                </Label>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="edit-isActive" className="cursor-pointer">
                Active Account
              </Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={updatingAdmin}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAdmin} disabled={updatingAdmin}>
              {updatingAdmin ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admin User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedAdmin?.name}</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAdmin}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAdmin} 
              disabled={deletingAdmin}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingAdmin ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

