"use client"
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
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
import { 
  File,
  Image,
  FileText,
  Plus,
  Eye,
  Minus
} from "lucide-react";
import { LibraryPickerModal } from "./LibraryPickerModal";


export function GroupFilesPanel({ groupId }) {
  const [files, setFiles] = useState([
    {
      id: 1,
      name: "Anxiety Management Worksheet.pdf",
      type: "pdf",
      size: "245 KB",
      sharedDate: "2 days ago",
      sharedBy: "Dr. Sarah Johnson"
    },
    {
      id: 2,
      name: "Session Notes Template.docx",
      type: "document",
      size: "128 KB",
      sharedDate: "1 week ago",
      sharedBy: "Dr. Sarah Johnson"
    },
    {
      id: 3,
      name: "Breathing Exercise Guide.jpg",
      type: "image",
      size: "89 KB",
      sharedDate: "2 weeks ago",
      sharedBy: "Dr. Sarah Johnson"
    }
  ]);

  const [libraryPickerOpen, setLibraryPickerOpen] = useState(false);
  const [fileToRemove, setFileToRemove] = useState(null);

  const handleShareFiles = (selectedFiles) => {
    const newFiles = selectedFiles.map((file, index) => ({
      id: files.length + index + 1,
      name: file.name,
      type: file.type.toLowerCase(),
      size: file.size,
      sharedDate: "Just now",
      sharedBy: "Dr. Sarah Johnson"
    }));
    
    setFiles(prev => [...newFiles, ...prev]);
    console.log("Shared files:", selectedFiles);
  };

  const handleViewFile = (fileId) => {
    const file = files.find(f => f.id === fileId);
    console.log("Viewing file:", file?.name);
    // Open file preview modal or navigate to file view
  };

  const handleRemoveFileClick = (file) => {
    setFileToRemove(file);
  };

  const handleConfirmRemove = () => {
    if (fileToRemove) {
      setFiles(prev => prev.filter(f => f.id !== fileToRemove.id));
      console.log("Removed file with ID:", fileToRemove.id);
      setFileToRemove(null);
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case "pdf": return <FileText className="h-4 w-4 text-red-500" />;
      case "image": return <Image className="h-4 w-4 text-blue-500" />;
      case "document": return <File className="h-4 w-4 text-blue-600" />;
      default: return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <>
      <Card className="shadow-soft border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground text-sm">Shared Files</CardTitle>
            <Button 
              size="sm" 
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => setLibraryPickerOpen(true)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[250px]">
            <div className="space-y-2">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.type.toUpperCase()} • {file.size} • {file.sharedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 w-6 p-0"
                      onClick={() => handleViewFile(file.id)}
                      title="Preview file"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveFileClick(file)}
                      title="Remove file"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <LibraryPickerModal
        open={libraryPickerOpen}
        onOpenChange={setLibraryPickerOpen}
        onShareFiles={handleShareFiles}
      />

      <AlertDialog open={!!fileToRemove} onOpenChange={() => setFileToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{fileToRemove?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove File
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
