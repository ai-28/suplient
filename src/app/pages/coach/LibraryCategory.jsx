"use client"
import { useState, useEffect } from "react";
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
  List,
  X
} from "lucide-react";
import { FileUploadDialog } from "@/app/components/FileUploadDialog";
import { ShareFileDialog } from "@/app/components/ShareFileDialog";
import { ToggleGroup, ToggleGroupItem } from "@/app/components/ui/toggle-group";
import { toast } from "sonner";

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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState(null);

  // Fetch items from API
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/library/${category}`);
        const result = await response.json();
        
        if (result.status) {
          const itemsKey = category === 'articles' ? 'articles' : category;
          const fetchedItems = result[itemsKey] || [];
          console.log(`Fetched ${category} items:`, fetchedItems);
          
          // Check for missing IDs
          const itemsWithoutId = fetchedItems.filter(item => !item.id);
          if (itemsWithoutId.length > 0) {
            console.warn('Items without ID found:', itemsWithoutId);
          }
          
          setItems(fetchedItems);
        } else {
          console.error('Failed to fetch items:', result.message);
          setItems([]);
        }
      } catch (error) {
        console.error('Error fetching items:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    if (category) {
      fetchItems();
    }
  }, [category]);

  const handleFileUpload = (uploadedFile) => {
    // Add the new file to the items list
    setItems(prev => [uploadedFile, ...prev]);
    toast.success("File uploaded successfully");
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
    if (selectedFiles.length === items.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(items.map(item => item.id));
    }
  };

  const handleShareSelected = (shareData) => {
    const selectedItems = items.filter(item => selectedFiles.includes(item.id));
    console.log('Multiple files shared:', selectedItems, 'with:', shareData);
    
    toast.success("Files Shared Successfully", {
      description: `${selectedFiles.length} files have been shared.`
    });
    
    // Clear selection after sharing
    setSelectedFiles([]);
  };

  const getSelectedFiles = () => {
    return items.filter(item => selectedFiles.includes(item.id));
  };

  const handlePreview = (item) => {
    console.log('Preview item:', item);
    console.log('Item URL:', item.url);
    console.log('Category:', category);
    
    // Since the direct URL works in browser, let's try using it directly first
    // If that fails, we can fall back to the preview API
    const directUrl = item.url;
    console.log('Using direct URL:', directUrl);
    console.log('URL type:', typeof directUrl);
    console.log('URL length:', directUrl?.length);
    
    // Determine if this is a PDF or other document type
    const fileName = item.fileName || item.url.split('/').pop() || '';
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    
    console.log('File extension:', fileExtension);
    
    // Set preview type based on actual file type, not category
    if (fileExtension === 'pdf') {
      setPreviewType('pdf');
    } else if (['doc', 'docx', 'txt', 'rtf'].includes(fileExtension)) {
      setPreviewType('document');
    } else {
      setPreviewType(category);
    }
    
    setPreviewUrl(directUrl);
  };

  const handleDownload = async (item) => {
    try {
      const response = await fetch(`/api/library/download?path=${encodeURIComponent(item.url)}&filename=${encodeURIComponent(item.title)}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.title || 'download';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success("Download started");
      } else {
        toast.error("Download failed");
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Download failed");
    }
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
                {loading ? 'Loading...' : `${items.length} items available`}
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
            {selectedFiles.length === items.length ? (
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

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading {categoryInfo.title.toLowerCase()}...</p>
          </div>
        </div>
      )}

      {/* Items Display */}
      {!loading && (
        <>
        {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item, index) => (
            <Card 
              key={item.id || `item-${index}`}
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
                <div 
                  className="bg-muted/30 rounded-lg p-4 h-32 flex items-center justify-center mb-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handlePreview(item)}
                >
                  {item.url ? (
                    <div className="w-full h-full flex items-center justify-center">
                      {category === 'images' ? (
                        <img 
                          src={`/api/library/preview?path=${encodeURIComponent(item.url)}`}
                          alt={item.title}
                          className="max-w-full max-h-full object-contain rounded"
                          onError={(e) => {
                            console.error('❌ Card image failed to load:', item.url);
                            e.target.style.display = 'none';
                            // Show fallback text
                            const fallback = document.createElement('div');
                            fallback.className = 'text-gray-500 text-sm text-center p-4';
                            fallback.textContent = item.title || 'Image preview unavailable';
                            e.target.parentNode.appendChild(fallback);
                          }}
                        />
                      ) : category === 'videos' ? (
                        <video 
                          src={`/api/library/preview?path=${encodeURIComponent(item.url)}`}
                          className="max-w-full max-h-full object-contain rounded"
                          controls={false}
                          onError={(e) => {
                            console.error('❌ Card video failed to load:', item.url);
                            e.target.style.display = 'none';
                            // Show fallback text
                            const fallback = document.createElement('div');
                            fallback.className = 'text-gray-500 text-sm text-center p-4';
                            fallback.textContent = item.title || 'Video preview unavailable';
                            e.target.parentNode.appendChild(fallback);
                          }}
                        />
                      ) : category === 'articles' ? (
                        <div className="text-center space-y-2">
                          <FileText className="h-8 w-8 text-muted-foreground mx-auto" />
                          <p className="text-xs text-muted-foreground">Click to preview</p>
                          <p className="text-xs text-muted-foreground/70">PDF/Document</p>
                        </div>
                      ) : category === 'sounds' ? (
                        <div className="text-center space-y-2">
                          <Music className="h-8 w-8 text-muted-foreground mx-auto" />
                          <p className="text-xs text-muted-foreground">Click to preview</p>
                          <p className="text-xs text-muted-foreground/70">Audio</p>
                        </div>
                      ) : (
                        <div className="text-center space-y-2">
                          <IconComponent className="h-8 w-8 text-muted-foreground mx-auto" />
                          <p className="text-xs text-muted-foreground">Click to preview</p>
                        </div>
                      )}
                    </div>
                  ) : (
                  <div className="text-center space-y-2">
                    <IconComponent className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-xs text-muted-foreground">No preview available</p>
                  </div>
                  )}
                </div>

                {/* Action Buttons - Only icons */}
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    title="Preview" 
                    className="px-3"
                    onClick={() => handlePreview(item)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    title="Download" 
                    className="px-3"
                    onClick={() => handleDownload(item)}
                  >
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
              {items.map((item, index) => (
            <Card 
              key={item.id || `item-${index}`}
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
                      <Button 
                        size="sm" 
                        variant="outline" 
                        title="Preview" 
                        className="px-3"
                        onClick={() => handlePreview(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        title="Download" 
                        className="px-3"
                        onClick={() => handleDownload(item)}
                      >
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
        </>
      )}

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
                <X className="h-4 w-4" />
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
                      console.log('✅ Image loaded successfully via API');
                      console.log('Image dimensions:', e.target.naturalWidth, 'x', e.target.naturalHeight);
                    }}
                    onError={(e) => {
                      console.error('❌ API image failed to load');
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
                    console.error('❌ API video failed to load');
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
                    console.error('❌ API audio failed to load');
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
                        console.error('❌ PDF failed to load via API');
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
                    <div className="w-full h-[60vh] border rounded bg-gray-50 flex items-center justify-center">
                      <div className="text-center p-8">
                        <div className="mb-4">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Document Preview</h3>
                        <p className="text-sm text-gray-500 mb-6">
                          This document type cannot be previewed directly in the browser. 
                          Please download the file to view it in a compatible application.
                        </p>
                        <div className="space-y-3">
                          <Button 
                            variant="default" 
                            className="w-full"
                            onClick={() => {
                              // Force download
                              const link = document.createElement('a');
                              link.href = `/api/library/preview?path=${encodeURIComponent(previewUrl)}`;
                              link.download = previewUrl.split('/').pop() || 'document';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                          >
                            Download Document
                          </Button>
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
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Document Preview</h4>
                    <iframe
                      src={`/api/library/preview?path=${encodeURIComponent(previewUrl)}`}
                      className="w-full h-[60vh] border rounded"
                      title="Document Preview"
                      onLoad={() => {
                        console.log('✅ Document loaded successfully via API');
                      }}
                      onError={() => {
                        console.error('❌ Document failed to load via API');
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
              )}
            </div>
          </div>
        </div>
      )} 
    </div>
  );
}