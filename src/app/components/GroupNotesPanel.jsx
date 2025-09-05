"use client"
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { 
  Plus,
  Save,
  X
} from "lucide-react";

export function GroupNotesPanel() {
  const [notes, setNotes] = useState([
    {
      id: 1,
      title: "Session 24 Observations",
      content: "Great participation from all members. John showed significant improvement in sharing personal experiences.",
      date: "2 hours ago",
      category: "session"
    },
    {
      id: 2,
      title: "Future Planning",
      content: "Plan to introduce mindfulness exercises in next session. Emma might benefit from individual follow-up.",
      date: "1 day ago",
      category: "plan"
    }
  ]);

  const [editingNote, setEditingNote] = useState(null);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [showNewNote, setShowNewNote] = useState(false);

  const handleAddNote = () => {
    if (newNoteContent.trim()) {
      const newNote = {
        id: Date.now(),
        title: `Note ${notes.length + 1}`,
        content: newNoteContent,
        date: "Just now",
        category: "other"
      };
      setNotes([newNote, ...notes]);
      setNewNoteContent("");
      setShowNewNote(false);
    }
  };

  return (
    <Card className="shadow-soft border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground text-sm">Notes</CardTitle>
          <Button 
            size="sm" 
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => setShowNewNote(!showNewNote)}
          >
            {showNewNote ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showNewNote && (
          <div className="p-3 bg-muted/30 rounded-lg space-y-3">
            <Textarea
              placeholder="Write your note here..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              className="min-h-[60px] text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddNote} className="text-xs">
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowNewNote(false)} className="text-xs">
                Cancel
              </Button>
            </div>
          </div>
        )}
        
        <ScrollArea className="h-[250px]">
          <div className="space-y-2">
            {notes.map((note) => (
              <div key={note.id} className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                <h4 className="text-xs font-medium text-foreground truncate">{note.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{note.date}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
