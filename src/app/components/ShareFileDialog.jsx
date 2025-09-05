"use client"
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Share2, Search, Users, User, UserCheck, MessageSquare } from "lucide-react";

// Mock data for clients and groups
const mockClients = [
  { id: 1, name: "John Doe", email: "john@example.com", type: "personal", status: "active" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", type: "group", status: "active" },
  { id: 3, name: "Mike Johnson", email: "mike@example.com", type: "personal", status: "inactive" },
  { id: 4, name: "Sarah Wilson", email: "sarah@example.com", type: "personal", status: "active" },
  { id: 5, name: "Tom Brown", email: "tom@example.com", type: "group", status: "active" },
];

const mockGroups = [
  { id: 1, name: "Anxiety Support Group", members: 8, type: "therapy" },
  { id: 2, name: "Mindfulness Circle", members: 12, type: "wellness" },
  { id: 3, name: "Teen Support Group", members: 6, type: "youth" },
];


export function ShareFileDialog({ file, files, onShare, children }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("individuals");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClients, setSelectedClients] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [shareMessage, setShareMessage] = useState("");
  const [sharing, setSharing] = useState(false);


  const filteredClients = mockClients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = mockGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClientToggle = (clientId) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleGroupToggle = (groupId) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleQuickSelect = (type) => {
    switch (type) {
      case "all-active":
        setSelectedClients(mockClients.filter(c => c.status === "active").map(c => c.id));
        break;
      case "all-clients":
        setSelectedClients(mockClients.map(c => c.id));
        break;
      case "all-groups":
        setSelectedGroups(mockGroups.map(g => g.id));
        break;
      case "clear":
        setSelectedClients([]);
        setSelectedGroups([]);
        break;
    }
  };

  const handleShare = async () => {
    if (selectedClients.length === 0 && selectedGroups.length === 0) {
      toast({
        title: "No Recipients Selected",
        description: "Please select at least one client or group to share with.",
        variant: "destructive"
      });
      return;
    }

    setSharing(true);
    
    // Simulate sharing process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const filesToShare = files || (file ? [file] : []);
    
    const shareData = {
      files: filesToShare,
      clients: selectedClients,
      groups: selectedGroups,
      message: shareMessage,
      sharedAt: new Date().toISOString()
    };

    onShare?.(shareData);
    
    const totalRecipients = selectedClients.length + selectedGroups.reduce((sum, groupId) => {
      const group = mockGroups.find(g => g.id === groupId);
      return sum + (group?.members || 0);
    }, 0);

    const fileCount = filesToShare.length;
    const fileText = fileCount === 1 ? "file" : "files";
    
    toast({
      title: "Files Shared Successfully",
      description: `${fileCount} ${fileText} shared with ${totalRecipients} recipients.`
    });

    // Reset form
    setSelectedClients([]);
    setSelectedGroups([]);
    setShareMessage("");
    setSharing(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {files && files.length > 1 
              ? `Share ${files.length} Files` 
              : `Share: ${file?.title || files?.[0]?.title}`
            }
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Quick Select Options */}
          <div className="space-y-2">
            <Label>Quick Select</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect("all-active")}
              >
                All Active Clients
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect("all-clients")}
              >
                All Clients
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect("all-groups")}
              >
                All Groups
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect("clear")}
              >
                Clear Selection
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Recipients</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search clients or groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Recipients Selection */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individuals">
                <User className="h-4 w-4 mr-2" />
                Individual Clients
              </TabsTrigger>
              <TabsTrigger value="groups">
                <Users className="h-4 w-4 mr-2" />
                Groups
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="individuals" className="space-y-3">
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredClients.map((client) => (
                  <Card key={client.id} className="cursor-pointer hover:bg-muted/50">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedClients.includes(client.id)}
                          onCheckedChange={() => handleClientToggle(client.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{client.name}</p>
                              <p className="text-sm text-muted-foreground">{client.email}</p>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant={client.type === "personal" ? "default" : "secondary"}>
                                {client.type}
                              </Badge>
                              <Badge variant={client.status === "active" ? "default" : "secondary"}>
                                {client.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="groups" className="space-y-3">
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredGroups.map((group) => (
                  <Card key={group.id} className="cursor-pointer hover:bg-muted/50">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedGroups.includes(group.id)}
                          onCheckedChange={() => handleGroupToggle(group.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{group.name}</p>
                              <p className="text-sm text-muted-foreground">{group.members} members</p>
                            </div>
                            <Badge variant="outline">{group.type}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Files to Share Summary */}
          {(files && files.length > 0) || file ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Files to Share</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {(files || [file]).map((f) => (
                    <Badge key={f.id} variant="outline">
                      {f.title}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Selected Recipients Summary */}
          {(selectedClients.length > 0 || selectedGroups.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Selected Recipients</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedClients.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Individual Clients ({selectedClients.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedClients.map(clientId => {
                        const client = mockClients.find(c => c.id === clientId);
                        return (
                          <Badge key={clientId} variant="secondary">
                            {client?.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
                {selectedGroups.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Groups ({selectedGroups.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedGroups.map(groupId => {
                        const group = mockGroups.find(g => g.id === groupId);
                        return (
                          <Badge key={groupId} variant="secondary">
                            {group?.name} ({group?.members} members)
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Share Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Share Message (Optional)</Label>
            <Textarea
              id="message"
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              placeholder="Add a personal message to accompany this shared file..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleShare} disabled={sharing}>
              {sharing ? "Sharing..." : "Share File"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}