"use client"
import { useState, useEffect } from "react";
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
  Image as ImageIcon,
  FileText,
  Video,
  Plus,
  Eye,
  Minus,
  Loader2
} from "lucide-react";
import { LibraryPickerModal } from "./LibraryPickerModal";


export function GroupFilesPanel({ groupId }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [libraryPickerOpen, setLibraryPickerOpen] = useState(false);
  const [fileToRemove, setFileToRemove] = useState(null);
  
  // Preview states
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState(null);

  const fetchGroupResources = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/resources/group/${groupId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch group resources');
      }
      const result = await response.json();
      setFiles(result.resources || []);
    } catch (err) {
      console.error('Error fetching group resources:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchGroupResources();
    }
  }, [groupId]);

  const handleShareFiles = async (selectedFiles) => {
    try {
      // Share each selected file with the group
      for (const file of selectedFiles) {
        const response = await fetch('/api/resources/share', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resourceId: file.id,
            groupIds: [groupId]
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to share ${file.name}`);
        }
      }

      // Refresh the files list
      await fetchGroupResources();
    } catch (error) {
      console.error('Error sharing files:', error);
      alert(`Error sharing files: ${error.message}`);
    }
  };

  const handleViewFile = (file) => {
    
    const directUrl = file.url;
    
    // Determine file type based on resourceType or file extension
    const fileName = file.fileName || file.url.split('/').pop() || '';
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    
    // Set preview type based on resourceType or file extension
    if (file.resourceType === 'image' || fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'png' || fileExtension === 'gif' || fileExtension === 'webp') {
      setPreviewType('images');
    } else if (file.resourceType === 'video' || fileExtension === 'mp4' || fileExtension === 'avi' || fileExtension === 'mov' || fileExtension === 'wmv') {
      setPreviewType('videos');
    } else if (file.resourceType === 'sound' || fileExtension === 'mp3' || fileExtension === 'wav' || fileExtension === 'ogg' || fileExtension === 'm4a') {
      setPreviewType('sounds');
    } else if (fileExtension === 'pdf') {
      setPreviewType('pdf');
    } else if (['doc', 'docx', 'txt', 'rtf'].includes(fileExtension)) {
      setPreviewType('document');
    } else {
      setPreviewType('document'); // Default fallback
    }
    
    setPreviewUrl(directUrl);
  };

  const handleRemoveFileClick = (file) => {
    setFileToRemove(file);
  };

  const handleConfirmRemove = async () => {
    if (fileToRemove) {
      try {
        const response = await fetch('/api/resources/remove-group', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resourceId: fileToRemove.id,
            groupId: groupId
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to remove file from group');
        }

        // Refresh the files list
        await fetchGroupResources();
        setFileToRemove(null);
      } catch (error) {
        console.error('Error removing file:', error);
        alert(`Error removing file: ${error.message}`);
      }
    }
  };

  const getFileIcon = (type) => {
    switch (type.toLowerCase()) {
      case "pdf": return <FileText className="h-4 w-4 text-red-500" />;
      case "video": case "mp4": return <Video className="h-4 w-4 text-blue-500" />;
      case "image": case "jpg": case "png": return <ImageIcon className="h-4 w-4 text-green-500" />;
      case "doc": case "docx": return <FileText className="h-4 w-4 text-blue-600" />;
      default: return <FileText className="h-4 w-4 text-muted-foreground" />;
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
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading files...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <p className="text-sm text-destructive mb-2">Error: {error}</p>
                  <Button size="sm" variant="outline" onClick={fetchGroupResources}>
                    Try Again
                  </Button>
                </div>
              </div>
            ) : files.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">No files shared yet</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getFileIcon(file.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{file.type} • {file.size}</p>
                        <p className="text-xs text-gray-500">Shared {file.sharedDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0"
                        onClick={() => handleViewFile(file)}
                        title="Preview file"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                        onClick={() => handleRemoveFileClick(file)}
                        title="Remove file"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Preview</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setPreviewUrl(null);
                  setPreviewType(null);
                }}
              >
                ✕
              </Button>
            </div>
            <div className="p-4">
              {previewType === 'images' ? (
                <div>
                  <img 
                    src={`/api/library/preview?path=${encodeURIComponent(previewUrl)}`}
                    alt="Preview"
                    className="max-w-full max-h-[70vh] object-contain mx-auto"
                    onLoad={(e) => {
                      console.log('Image dimensions:', e.target.naturalWidth, 'x', e.target.naturalHeight);
                    }}
                    onError={(e) => {
                      console.log('❌ Image failed to load via API');
                      e.target.style.display = 'none';
                      // Show fallback message
                      const fallback = document.createElement('div');
                      fallback.className = 'text-center py-8';
                      fallback.innerHTML = `
                        <p class="text-muted-foreground mb-4">Preview failed to load</p>
                        <p class="text-xs text-red-500 mb-2">URL: ${previewUrl}</p>
                        <button 
                          class="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                          onclick="window.open('${previewUrl}', '_blank')"
                        >
                          Open in New Tab
                        </button>
                      `;
                      e.target.parentNode.appendChild(fallback);
                    }}
                  />
                </div>
              ) : previewType === 'videos' ? (
                <video 
                  src={`/api/library/preview?path=${encodeURIComponent(previewUrl)}`}
                  controls
                  className="max-w-full max-h-[70vh] mx-auto"
                  onLoadStart={() => {
                    console.log('✅ Video started loading via API');
                  }}
                  onError={(e) => {
                    console.log('❌ Video failed to load via API');
                    e.target.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.className = 'text-center py-8';
                    fallback.innerHTML = `
                      <p class="text-muted-foreground mb-4">Video failed to load</p>
                      <p class="text-xs text-red-500 mb-2">URL: ${previewUrl}</p>
                      <button 
                        class="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                        onclick="window.open('${previewUrl}', '_blank')"
                      >
                        Open in New Tab
                      </button>
                    `;
                    e.target.parentNode.appendChild(fallback);
                  }}
                />
              ) : previewType === 'sounds' ? (
                <audio 
                  src={`/api/library/preview?path=${encodeURIComponent(previewUrl)}`}
                  controls
                  className="w-full"
                  onLoadStart={() => {
                    console.log('✅ Audio started loading via API');
                  }}
                  onError={(e) => {
                    console.log('❌ Audio failed to load via API');
                    e.target.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.className = 'text-center py-8';
                    fallback.innerHTML = `
                      <p class="text-muted-foreground mb-4">Audio failed to load</p>
                      <p class="text-xs text-red-500 mb-2">URL: ${previewUrl}</p>
                      <button 
                        class="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                        onclick="window.open('${previewUrl}', '_blank')"
                      >
                        Open in New Tab
                      </button>
                    `;
                    e.target.parentNode.appendChild(fallback);
                  }}
                />
              ) : previewType === 'pdf' ? (
                <div>
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">PDF Preview</h4>
                    <iframe
                      src={`/api/library/preview?path=${encodeURIComponent(previewUrl)}`}
                      className="w-full h-[60vh] border rounded"
                      title="PDF Preview"
                      onLoad={() => {
                        console.log('✅ PDF loaded successfully via API');
                      }}
                      onError={() => {
                        console.log('❌ PDF failed to load via API');
                      }}
                    />
                  </div>
                  <div className="text-center">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        const apiUrl = `/api/library/preview?path=${encodeURIComponent(previewUrl)}`;
                        window.open(apiUrl, '_blank');
                      }}
                    >
                      Open in New Tab
                    </Button>
                  </div>
                </div>
              ) : previewType === 'document' ? (
                <div>
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Document Preview</h4>
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">Document preview not available</p>
                      <p className="text-xs text-muted-foreground mb-4">This file type cannot be previewed inline</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        const apiUrl = `/api/library/preview?path=${encodeURIComponent(previewUrl)}`;
                        window.open(apiUrl, '_blank');
                      }}
                    >
                      Open in New Tab
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        window.open(previewUrl, '_blank');
                      }}
                    >
                      Open Original URL
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      window.open(previewUrl, '_blank');
                    }}
                  >
                    Open in New Tab
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
