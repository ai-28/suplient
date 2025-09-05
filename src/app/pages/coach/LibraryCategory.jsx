"use client"
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Checkbox } from "@/app/components/ui/checkbox";
import { 
  ArrowLeft,
  Video, 
  Image, 
  FileText, 
  Music, 
  FileImage,
  BookOpen,
  Play,
  Download,
  Eye,
  Upload,
  Share2,
  CheckSquare,
  Square,
  Grid3X3,
  List
} from "lucide-react";
import { FileUploadDialog } from "@/app/components/FileUploadDialog";
import { ShareFileDialog } from "@/app/components/ShareFileDialog";
import { ToggleGroup, ToggleGroupItem } from "@/app/components/ui/toggle-group";

const categoryData = {
  videos: {
    title: "Videos",
    icon: Video,
    color: "bg-primary",
    items: [
      {
        id: 1,
        title: "Introduction to Mindfulness",
        description: "A comprehensive guide to mindfulness techniques for beginners",
        duration: "15:30",
        format: "MP4",
        size: "45 MB",
        thumbnail: "/placeholder.svg"
      },
      {
        id: 2,
        title: "Breathing Exercises",
        description: "Guided breathing exercises for anxiety relief",
        duration: "12:45",
        format: "MP4",
        size: "38 MB",
        thumbnail: "/placeholder.svg"
      },
      {
        id: 3,
        title: "Progressive Muscle Relaxation",
        description: "Step-by-step muscle relaxation technique",
        duration: "20:15",
        format: "MP4",
        size: "62 MB",
        thumbnail: "/placeholder.svg"
      }
    ]
  },
  images: {
    title: "Images",
    icon: Image,
    color: "bg-accent",
    items: [
      {
        id: 1,
        title: "Emotion Wheel",
        description: "Visual representation of different emotions",
        format: "PNG",
        size: "2.1 MB",
        dimensions: "1920x1080",
        thumbnail: "/placeholder.svg"
      },
      {
        id: 2,
        title: "Mindfulness Poster",
        description: "Educational poster about mindfulness benefits",
        format: "JPG",
        size: "1.8 MB",
        dimensions: "1080x1350",
        thumbnail: "/placeholder.svg"
      }
    ]
  },
  articles: {
    title: "Articles",
    icon: FileText,
    color: "bg-secondary",
    items: [
      {
        id: 1,
        title: "Understanding Anxiety Disorders",
        description: "Comprehensive research on anxiety and treatment approaches",
        author: "Dr. Sarah Johnson",
        pages: 12,
        format: "PDF",
        size: "1.2 MB"
      },
      {
        id: 2,
        title: "Cognitive Behavioral Therapy Basics",
        description: "Introduction to CBT techniques and applications",
        author: "Dr. Michael Chen",
        pages: 8,
        format: "PDF",
        size: "950 KB"
      }
    ]
  },
  sounds: {
    title: "Sounds",
    icon: Music,
    color: "bg-blue-teal",
    items: [
      {
        id: 1,
        title: "Ocean Waves",
        description: "Calming ocean sounds for relaxation",
        duration: "30:00",
        format: "MP3",
        size: "28 MB",
        bitrate: "320 kbps"
      },
      {
        id: 2,
        title: "Forest Ambience",
        description: "Natural forest sounds with birds",
        duration: "45:00",
        format: "MP3",
        size: "42 MB",
        bitrate: "320 kbps"
      }
    ]
  },
};

export default function LibraryCategory() {
  const { category } = useParams();
  const router = useRouter();
  
  const categoryInfo = categoryData[category];
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [viewMode, setViewMode] = useState('grid');

  const handleFileUpload = (file) => {
    // In a real app, this would save to a database
    console.log('File uploaded:', file);
  };

  const handleFileShare = (file, shareData) => {
    // In a real app, this would handle the sharing logic
    console.log('File shared:', file, 'with:', shareData);
  };

  const handleFileToggle = (fileId) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === categoryInfo.items.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(categoryInfo.items.map(item => item.id));
    }
  };

  const handleShareSelected = (shareData) => {
    const selectedItems = categoryInfo.items.filter(item => selectedFiles.includes(item.id));
    console.log('Multiple files shared:', selectedItems, 'with:', shareData);
    
    toast({
      title: "Files Shared Successfully",
      description: `${selectedFiles.length} files have been shared.`
    });
    
    // Clear selection after sharing
    setSelectedFiles([]);
  };

  const getSelectedFiles = () => {
    return categoryInfo.items.filter(item => selectedFiles.includes(item.id));
  };
  
  if (!categoryInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Category not found</p>
      </div>
    );
  }

  const IconComponent = categoryInfo.icon;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/coach/library')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className={`${categoryInfo.color} rounded-lg p-2`}>
              <IconComponent className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground">{categoryInfo.title}</h2>
              <p className="text-muted-foreground">
                {categoryInfo.items.length} items available
                {selectedFiles.length > 0 && ` • ${selectedFiles.length} selected`}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <FileUploadDialog
            category={category || ""}
            onUploadComplete={handleFileUpload}
          >
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </FileUploadDialog>
          
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value)}
            className="border rounded-lg"
          >
            <ToggleGroupItem value="grid" aria-label="Grid View">
              <Grid3X3 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List View">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          
          <Button 
            variant="outline" 
            onClick={handleSelectAll}
            className="flex items-center gap-2"
          >
            {selectedFiles.length === categoryInfo.items.length ? (
              <>
                <CheckSquare className="h-4 w-4" />
                Deselect All
              </>
            ) : (
              <>
                <Square className="h-4 w-4" />
                Select All
              </>
            )}
          </Button>
          
          {selectedFiles.length > 0 && (
            <ShareFileDialog 
              files={getSelectedFiles()}
              onShare={handleShareSelected}
            >
              <Button className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Share Selected ({selectedFiles.length})
              </Button>
            </ShareFileDialog>
          )}
        </div>
      </div>

      {/* Items Display */}
        {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryInfo.items.map((item) => (
            <Card 
              key={item.id}
              className={`shadow-soft border-border bg-card hover:shadow-medium transition-all group flex flex-col cursor-pointer ${
                selectedFiles.includes(item.id) ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleFileToggle(item.id)}
            >
              <CardHeader className="pb-4">
                <CardTitle className="text-foreground flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedFiles.includes(item.id)}
                      onCheckedChange={() => handleFileToggle(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                    />
                    <span className="flex-1 pr-2">{item.title}</span>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {item.format}
                  </Badge>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {/* Top content */}
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {item.description}
                  </p>

                  {/* Item Details */}
                  <div className="space-y-2 text-xs text-muted-foreground">
                    {item.size && <div>Size: {item.size}</div>}
                    {item.duration && <div>Duration: {item.duration}</div>}
                    {item.pages && <div>Pages: {item.pages}</div>}
                    {item.author && <div>Author: {item.author}</div>}
                    {item.dimensions && <div>Dimensions: {item.dimensions}</div>}
                    {item.sessions && <div>Sessions: {item.sessions}</div>}
                    {item.level && <div>Level: {item.level}</div>}
                  </div>
                </div>

                {/* Preview Area - positioned above buttons */}
                <div className="bg-muted/30 rounded-lg p-4 h-32 flex items-center justify-center mb-4">
                  <div className="text-center space-y-2">
                    <IconComponent className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-xs text-muted-foreground">Preview</p>
                  </div>
                </div>

                {/* Action Buttons - Only icons */}
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="outline" title="View" className="px-3">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" title="Download" className="px-3">
                    <Download className="h-4 w-4" />
                  </Button>
                  <ShareFileDialog
                    file={item}
                    onShare={(shareData) => handleFileShare(item, shareData)}
                  >
                    <Button size="sm" className="px-3 bg-primary hover:bg-primary/90" title="Share">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </ShareFileDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {categoryInfo.items.map((item) => (
            <Card 
              key={item.id}
              className={`shadow-soft border-border bg-card hover:shadow-medium transition-all cursor-pointer ${
                selectedFiles.includes(item.id) ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleFileToggle(item.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      checked={selectedFiles.includes(item.id)}
                      onCheckedChange={() => handleFileToggle(item.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex items-center gap-3">
                      <div className={`${categoryInfo.color} rounded-md p-2`}>
                        <IconComponent className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground">{item.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {item.format}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-xs text-muted-foreground space-y-1">
                      {item.size && <div>Size: {item.size}</div>}
                      {item.duration && <div>Duration: {item.duration}</div>}
                      {item.pages && <div>Pages: {item.pages}</div>}
                      {item.author && <div>Author: {item.author}</div>}
                      {item.dimensions && <div>Dimensions: {item.dimensions}</div>}
                      {item.sessions && <div>Sessions: {item.sessions}</div>}
                      {item.level && <div>Level: {item.level}</div>}
                    </div>
                    
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="outline" title="View" className="px-3">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" title="Download" className="px-3">
                        <Download className="h-4 w-4" />
                      </Button>
                      <ShareFileDialog
                        file={item}
                        onShare={(shareData) => handleFileShare(item, shareData)}
                      >
                        <Button size="sm" className="px-3 bg-primary hover:bg-primary/90" title="Share">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </ShareFileDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )} 
    </div>
  );
}