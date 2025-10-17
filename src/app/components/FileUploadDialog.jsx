"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Card, CardContent } from "@/app/components/ui/card";
import { Upload, X, File, Image, Video, Music, FileText, FileImage, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

const categoryIcons = {
  videos: Video,
  images: Image,
  articles: FileText,
  sounds: Music,
  templates: FileImage,
  programs: BookOpen
};

const acceptedFormats = {
  videos: ".mp4,.mov,.avi,.mkv,.webm",
  images: ".jpg,.jpeg,.png,.gif,.webp,.svg",
  articles: ".pdf,.doc,.docx,.txt",
  sounds: ".mp3,.wav,.m4a,.ogg,.aac",
  templates: ".docx,.xlsx,.pptx,.pdf",
  programs: ".zip,.pdf,.docx"
};

const fileFieldNames = {
  videos: 'video',
  images: 'image',
  articles: 'article',
  sounds: 'sound',
  templates: 'template',
  programs: 'program'
};

export function FileUploadDialog({ category, onUploadComplete, children }) {
  const [open, setOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [uploading, setUploading] = useState(false);

  const IconComponent = categoryIcons[category] || File;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setTitle(e.dataTransfer.files[0].name.split('.')[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setTitle(e.target.files[0].name.split('.')[0]);
    }
  };

  const handleSelectFileClick = () => {
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleUpload = async () => {
    
    // Check for missing fields and show comprehensive error message
    const missingFields = [];
    
    if (!selectedFile) {
      missingFields.push("File selection");
    }
    
    if (!title.trim()) {
      missingFields.push("Title");
    }
    
    if (!description.trim()) {
      missingFields.push("Description");
    }
    
    if (missingFields.length > 0) {
      const errorMessage = missingFields.length === 1 
        ? `Please fill in: ${missingFields[0]}`
        : `Please fill in the following fields: ${missingFields.join(", ")}`;
        
      toast.error("Missing Required Information", {
        description: errorMessage
      });
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append(fileFieldNames[category], selectedFile);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('role', 'coach');
      
      if (category === 'articles' && author.trim()) {
        formData.append('author', author.trim());
      }

      const response = await fetch(`/api/library/${category}`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.status) {
        toast.success("Upload Successful", {
          description: `${title} has been uploaded to ${category}.`
        });
        
        onUploadComplete?.(result.data);
        
        // Reset form
        setSelectedFile(null);
        setTitle("");
        setDescription("");
        setAuthor("");
        setOpen(false);
      } else {
        toast.error("Upload Failed", {
          description: result.message || "Failed to upload file"
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Upload Failed", {
        description: "An error occurred while uploading the file"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            Upload to {category.charAt(0).toUpperCase() + category.slice(1)}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? "border-primary bg-primary/5" 
                : !selectedFile 
                  ? "border-red-300 bg-red-50/50" 
                  : "border-muted-foreground/25"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <File className="h-8 w-8 text-primary" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-lg font-medium">Drop files here or click to browse</p>
                  <p className="text-sm text-muted-foreground">
                    Accepted formats: {acceptedFormats[category]}
                  </p>
                  <p className="text-xs text-red-500 mt-2">⚠️ Please select a file to upload</p>
                </div>
                <Input
                  type="file"
                  accept={acceptedFormats[category]}
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <Button 
                  variant="outline" 
                  className="w-full cursor-pointer"
                  onClick={handleSelectFileClick}
                >
                  Select File
                </Button>
              </div>
            )}
          </div>

          {/* File Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter file title"
                className={!title.trim() ? "border-red-500 focus:border-red-500" : ""}
              />
              {!title.trim() && (
                <p className="text-xs text-red-500">Title is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the content and purpose of this file"
                rows={3}
                required
                className={!description.trim() ? "border-red-500" : ""}
              />
              <div className="text-xs text-muted-foreground">
                {description.length} characters {!description.trim() && "(Required)"}
              </div>
            </div>

            {category === 'articles' && (
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Enter author name"
                />
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload File
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}