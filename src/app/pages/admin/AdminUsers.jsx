"use client"

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { PageHeader } from "@/app/components/PageHeader";
import { UserCog, Mail, Shield, UserPlus } from "lucide-react";

export default function AdminUsers() {
  const { data: session } = useSession();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/admins');
        const data = await response.json();
        
        if (data.success) {
          setAdmins(data.admins || []);
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
        subtitle="Manage system administrators"
      >
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Admin
        </Button>
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
            <div className="grid grid-cols-4 gap-4 p-4 text-sm font-medium text-muted-foreground bg-muted/30 rounded-lg">
              <div>Name</div>
              <div>Email</div>
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
                  className="grid grid-cols-4 gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium">{admin.name}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {admin.email}
                    </div>
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
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

