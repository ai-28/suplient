"use client"
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Badge } from "@/app/components/ui/badge";
import { Checkbox } from "@/app/components/ui/checkbox";
import { 
  Video,
  Image,
  FileText,
  Volume2,
  Layout,
  BookOpen,
  Eye,
  Share2
} from "lucide-react";

const categories = [
  { id: "videos", name: "Videos", icon: Video, color: "text-blue-500" },
  { id: "images", name: "Images", icon: Image, color: "text-green-500" },
  { id: "articles", name: "Articles", icon: FileText, color: "text-purple-500" },
  { id: "sounds", name: "Sounds", icon: Volume2, color: "text-orange-500" },
];

const mockFiles = [
  { id: 1, name: "Anxiety Management Techniques.mp4", type: "Video", category: "videos", size: "45 MB" },
  { id: 2, name: "Breathing Exercise Guide.jpg", type: "Image", category: "images", size: "2.1 MB" },
  { id: 3, name: "Mindfulness Article.pdf", type: "PDF", category: "articles", size: "1.5 MB" },
  { id: 4, name: "Relaxation Sounds.mp3", type: "Audio", category: "sounds", size: "8.2 MB" },
];

export function LibraryPickerModal({ open, onOpenChange, onShareFiles }) {
  const [selectedCategory, setSelectedCategory] = useState("videos");
  const [selectedFiles, setSelectedFiles] = useState([]);

  const filteredFiles = mockFiles.filter(file => file.category === selectedCategory);

  const toggleFileSelection = (file) => {
    setSelectedFiles(prev => 
      prev.find(f => f.id === file.id)
        ? prev.filter(f => f.id !== file.id)
        : [...prev, file]
    );
  };

  const handleShare = () => {
    onShareFiles(selectedFiles);
    setSelectedFiles([]);
    onOpenChange(false);
  };

  const getFileIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'video': return <Video className="h-4 w-4 text-blue-500" />;
      case 'image': return <Image className="h-4 w-4 text-green-500" />;
      case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
      case 'audio': return <Volume2 className="h-4 w-4 text-orange-500" />;
      case 'document': return <FileText className="h-4 w-4 text-blue-600" />;
      default: return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[600px]">
        <DialogHeader>
          <DialogTitle>Share Files from Library</DialogTitle>
        </DialogHeader>
        
        <div className="flex h-full gap-4">
          {/* Categories Sidebar */}
          <div className="w-48 border-r border-border pr-4">
            <ScrollArea className="h-full">
              <div className="space-y-1">
                {categories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <IconComponent className={`h-4 w-4 mr-2 ${category.color}`} />
                      {category.name}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Files Grid */}
          <div className="flex-1">
            <ScrollArea className="h-full">
              <div className="grid grid-cols-2 gap-3">
                {filteredFiles.map((file) => (
                  <div 
                    key={file.id} 
                    className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedFiles.some(f => f.id === file.id)}
                      onCheckedChange={() => toggleFileSelection(file)}
                    />
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.type} • {file.size}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-2">
            {selectedFiles.length > 0 && (
              <Badge variant="secondary">
                {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleShare}
              disabled={selectedFiles.length === 0}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Selected Files
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
