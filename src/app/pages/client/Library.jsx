"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { 
  Library as LibraryIcon, 
  Video, 
  Image, 
  FileText, 
  Music, 
  FileImage,
  BookOpen,
  Search,
  Download,
  Eye,
  Calendar,
  User,
  Users
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "@/app/context/LanguageContext";
import { FilePreviewModal } from "@/app/components/FilePreviewModal";
import { FileViewer } from "@capacitor/file-viewer";
import { Capacitor } from "@capacitor/core";
import { isNative } from "@/lib/capacitor";
import { toast } from "sonner";

// Mock data for shared files
const sharedFiles = [
  {
    id: 1,
    title: "Introduction to Mindfulness",
    description: "A comprehensive guide to mindfulness techniques for beginners",
    category: "videos",
    format: "MP4",
    size: "45 MB",
    duration: "15:30",
    sharedBy: "Dr. Sarah",
    sharedAt: "2024-01-15T10:30:00Z",
    shareType: "individual",
    message: "This video will help you get started with mindfulness practice.",
    viewed: false
  },
  {
    id: 2,
    title: "Breathing Exercises",
    description: "Guided breathing exercises for anxiety relief",
    category: "videos",
    format: "MP4",
    size: "38 MB",
    duration: "12:45",
    sharedBy: "Dr. Sarah",
    sharedAt: "2024-01-14T14:20:00Z",
    shareType: "group",
    groupName: "Anxiety Support Group",
    message: "Practice these exercises daily for best results.",
    viewed: true
  },
  {
    id: 3,
    title: "Managing Anxiety",
    description: "Comprehensive research on anxiety and treatment approaches",
    category: "articles",
    format: "PDF",
    size: "1.2 MB",
    pages: 12,
    author: "Dr. Johnson",
    sharedBy: "Dr. Sarah",
    sharedAt: "2024-01-13T09:15:00Z",
    shareType: "individual",
    message: "This article provides excellent insights into anxiety management.",
    viewed: true
  },
  {
    id: 4,
    title: "Ocean Waves",
    description: "Calming ocean sounds for relaxation",
    category: "sounds",
    format: "MP3",
    size: "28 MB",
    duration: "30:00",
    sharedBy: "Dr. Sarah",
    sharedAt: "2024-01-12T16:45:00Z",
    shareType: "group",
    groupName: "Mindfulness Circle",
    message: "Use this for your daily meditation practice.",
    viewed: false
  }
];

const categoryIcons = {
  videos: Video,
  images: Image,
  articles: FileText,
  sounds: Music
};

const categoryColors = {
  videos: "bg-primary",
  images: "bg-accent",
  articles: "bg-secondary",
  sounds: "bg-blue-teal"
};

export default function ClientLibrary() {
  const t = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [previewFile, setPreviewFile] = useState({ url: null, name: null });
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size and native platform
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || isNative());
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredFiles = sharedFiles.filter(file => {
    const matchesSearch = file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || file.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryCounts = sharedFiles.reduce((acc, file) => {
    acc[file.category] = (acc[file.category] || 0) + 1;
    return acc;
  }, {});

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const sharedDate = new Date(timestamp);
    const diffInDays = Math.floor((now.getTime() - sharedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return t('common.time.today', "Today");
    if (diffInDays === 1) return t('common.time.yesterday', "Yesterday");
    if (diffInDays < 7) return t('common.time.daysAgo', "{count} days ago", { count: diffInDays });
    return sharedDate.toLocaleDateString();
  };

  // Helper function to open file in native viewer (for Capacitor apps)
  const openFileInNativeViewer = async (fileUrl, fileName, fileType) => {
    if (!Capacitor.isNativePlatform() || !FileViewer) {
      return false;
    }

    try {
      const platform = Capacitor.getPlatform();
      
      // Get MIME type
      const getMimeType = (fileName) => {
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        const mimeTypes = {
          'mp4': 'video/mp4', 'avi': 'video/x-msvideo', 'mov': 'video/quicktime',
          'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'm4a': 'audio/mp4',
          'pdf': 'application/pdf',
        };
        return mimeTypes[extension] || 'application/octet-stream';
      };

      const mimeType = getMimeType(fileName);
      const finalFileName = fileName || fileUrl.split('/').pop() || 'file';

      // For videos and audio, use native viewer
      if (fileType === 'video' || fileType === 'audio') {
        if (platform === 'ios' && FileViewer.previewMediaContentFromUrl) {
          await FileViewer.previewMediaContentFromUrl({
            url: fileUrl,
            mimeType: mimeType
          });
        } else {
          await FileViewer.openDocumentFromUrl({
            url: fileUrl,
            filename: finalFileName
          });
        }
        return true;
      }
      
      // For PDFs and documents, use native viewer
      if (fileType === 'pdf' || fileType === 'document') {
        await FileViewer.openDocumentFromUrl({
          url: fileUrl,
          filename: finalFileName
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error opening file in native viewer:', error);
      return false;
    }
  };

  // Handle file preview
  const handleFilePreview = async (file) => {
    // For now, using mock data structure
    // In production, you'd fetch the actual file URL from API
    // For demo purposes, we'll construct a URL based on the file data
    
    // Determine file type from category
    let fileType = 'document';
    if (file.category === 'videos') {
      fileType = 'video';
    } else if (file.category === 'images') {
      fileType = 'image';
    } else if (file.category === 'sounds') {
      fileType = 'audio';
    } else if (file.category === 'articles' && file.format === 'PDF') {
      fileType = 'pdf';
    }

    // Mock URL - in production, this would come from the API
    // For now, we'll use a placeholder that would work with the preview API
    const fileUrl = `/api/library/preview?path=library/${file.category}/${file.id}`;
    const fileName = `${file.title}.${file.format.toLowerCase()}`;

    // For Capacitor native apps: use native viewer for videos, audio, PDFs
    // For images: always use modal (better UX)
    if (Capacitor.isNativePlatform() && fileType !== 'image') {
      // For native apps, we need the actual CDN URL, not the preview API
      // This would need to be fetched from the API in production
      // For now, we'll try to open it, but it may need the actual URL
      const opened = await openFileInNativeViewer(fileUrl, fileName, fileType);
      if (opened) {
        toast.success(`Opening ${fileType} in native viewer...`);
        return;
      }
      // Fall through to modal if native viewer fails
    }
    
    // For web or if native viewer failed: use modal
    // Images always use modal
    setPreviewFile({ url: fileUrl, name: fileName });
    toast.success(`Opening ${fileType} preview...`);
  };

  // Handle file download
  const handleFileDownload = async (file) => {
    // Mock download - in production, this would fetch the file URL from API
    toast.info(t('library.downloading', 'Downloading file...'));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t('library.sharedLibrary', 'Shared Library')}</h2>
          <p className="text-muted-foreground mt-1">{t('library.subtitle', 'Resources shared by your coach')}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('library.searchPlaceholder', 'Search shared resources...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">{t('library.all', 'All')} ({sharedFiles.length})</TabsTrigger>
          <TabsTrigger value="videos">{t('library.videos', 'Videos')} ({categoryCounts.videos || 0})</TabsTrigger>
          <TabsTrigger value="images">{t('library.images', 'Images')} ({categoryCounts.images || 0})</TabsTrigger>
          <TabsTrigger value="articles">{t('library.articles', 'Articles')} ({categoryCounts.articles || 0})</TabsTrigger>
          <TabsTrigger value="sounds">{t('library.sounds', 'Sounds')} ({categoryCounts.sounds || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          {filteredFiles.length === 0 ? (
            <Card className="p-8">
              <div className="text-center">
                <LibraryIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('library.noResources', 'No shared resources found')}</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? t('library.adjustSearch', "Try adjusting your search terms") : t('library.noResourcesYet', "Your coach hasn't shared any resources yet")}
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFiles.map((file) => {
                const IconComponent = categoryIcons[file.category];
                const colorClass = categoryColors[file.category];
                
                return (
                  <Card key={file.id} className={`shadow-soft border-border bg-card hover:shadow-medium transition-all ${!file.viewed ? 'ring-2 ring-primary/20' : ''}`}>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-foreground flex items-start justify-between">
                        <span className="flex-1 pr-2">{file.title}</span>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="shrink-0">
                            {file.format}
                          </Badge>
                          {!file.viewed && (
                            <Badge variant="destructive" className="text-xs">
                              {t('library.new', 'New')}
                            </Badge>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {file.description}
                      </p>

                      {/* File Details */}
                      <div className="space-y-2 text-xs text-muted-foreground">
                        {file.size && <div>{t('library.size', 'Size')}: {file.size}</div>}
                        {file.duration && <div>{t('library.duration', 'Duration')}: {file.duration}</div>}
                        {file.pages && <div>{t('library.pages', 'Pages')}: {file.pages}</div>}
                        {file.author && <div>{t('library.author', 'Author')}: {file.author}</div>}
                      </div>

                      {/* Share Info */}
                      <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4" />
                          <span>{t('library.sharedBy', 'Shared by')} {file.sharedBy}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatTimeAgo(file.sharedAt)}</span>
                        </div>
                        {file.shareType === "group" && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{file.groupName}</span>
                          </div>
                        )}
                        {file.message && (
                          <div className="text-sm italic text-muted-foreground border-l-2 border-primary/20 pl-2">
                            "{file.message}"
                          </div>
                        )}
                      </div>

                      {/* Preview Area */}
                      <div className="bg-muted/30 rounded-lg p-4 h-32 flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <div className={`${colorClass} rounded-lg p-2 w-fit mx-auto`}>
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                          <p className="text-xs text-muted-foreground">{t('library.preview', 'Preview')}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleFilePreview(file)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          {t('library.view', 'View')}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleFileDownload(file)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          {t('library.download', 'Download')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Modal */}
      <FilePreviewModal
        open={!!previewFile.url}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewFile({ url: null, name: null });
          }
        }}
        fileUrl={previewFile.url}
        fileName={previewFile.name}
        isMobile={isMobile}
      />
    </div>
  );
}