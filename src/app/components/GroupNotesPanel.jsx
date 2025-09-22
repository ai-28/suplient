"use client"
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { CreateGroupNoteDialog } from "./CreateGroupNoteDialog";

export function GroupNotesPanel({ groupId }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGroupNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/groups/${groupId}/notes`);
      if (!response.ok) {
        throw new Error('Failed to fetch group notes');
      }
      const result = await response.json();
      setNotes(result.notes || []);
    } catch (err) {
      console.error('Error fetching group notes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchGroupNotes();
    }
  }, [groupId]);

  const handleNoteCreated = (newNote) => {
    setNotes(prev => [newNote, ...prev]);
  };

  return (
    <Card className="shadow-soft border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground text-sm">Notes</CardTitle>
          <CreateGroupNoteDialog 
            groupId={groupId}
            onNoteCreated={handleNoteCreated}
          >
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </CreateGroupNoteDialog>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[250px]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading notes...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <p className="text-sm text-destructive mb-2">Error: {error}</p>
                <Button size="sm" variant="outline" onClick={fetchGroupNotes}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : notes.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">No notes yet</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {notes.map((note) => (
                <div key={note.id} className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                  <h4 className="text-xs font-medium text-foreground truncate">{note.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {note.description || 'No description'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
