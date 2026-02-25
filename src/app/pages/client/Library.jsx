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
  const [sharedFiles, setSharedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detect mobile screen size and native platform
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || isNative());
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch shared files from API
  useEffect(() => {
    const fetchSharedFiles = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/resources');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch shared files');
        }
        
        const data = await response.json();
        const resources = data.resources || [];
        
        // Map API resources to Library component format
        const mappedFiles = resources.map(resource => {
          // Map resource type to category
          let category = 'articles';
          if (resource.type === 'Video' || resource.category === 'Videos') {
            category = 'videos';
          } else if (resource.type === 'Image' || resource.category === 'Images') {
            category = 'images';
          } else if (resource.type === 'Audio' || resource.type === 'Sound' || resource.category === 'Sounds') {
            category = 'sounds';
          } else if (resource.type === 'Article' || resource.category === 'Articles') {
            category = 'articles';
          }
          
          // Get file format from fileName or fileType
          const fileName = resource.fileName || resource.title || '';
          const fileExtension = fileName.split('.').pop()?.toUpperCase() || resource.fileType?.toUpperCase() || '';
          
          // Format file size
          const formatFileSize = (bytes) => {
            if (!bytes) return 'Unknown';
            const mb = bytes / (1024 * 1024);
            if (mb >= 1) return `${mb.toFixed(1)} MB`;
            const kb = bytes / 1024;
            return `${kb.toFixed(1)} KB`;
          };
          
          return {
            id: resource.id,
            title: resource.title,
            description: resource.description || '',
            category: category,
            format: fileExtension,
            size: formatFileSize(resource.fileSize),
            duration: resource.duration || '',
            sharedBy: resource.sharedBy || 'Coach',
            sharedAt: resource.updatedAt || resource.createdAt || new Date().toISOString(),
            shareType: resource.groupIds?.length > 0 ? 'group' : 'individual',
            groupName: resource.groupName || '',
            message: resource.message || '',
            viewed: false, // TODO: Track viewed status
            url: resource.url,
            fileName: resource.fileName || fileName,
            author: resource.author || ''
          };
        });
        
        setSharedFiles(mappedFiles);
      } catch (err) {
        console.error('Error fetching shared files:', err);
        setError(err.message);
        setSharedFiles([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSharedFiles();
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
    try {
      // Fetch the actual file URL from the access API
      const response = await fetch(`/api/resources/${file.id}/access?action=access`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to access file');
      }
      
      const data = await response.json();
      const fileUrl = data.resource.url;
      const fileName = data.resource.fileName || file.fileName || file.title;
      
      // Determine file type from category
      let fileType = 'document';
      if (file.category === 'videos') {
        fileType = 'video';
      } else if (file.category === 'images') {
        fileType = 'image';
      } else if (file.category === 'sounds') {
        fileType = 'audio';
      } else if (file.category === 'articles' && (file.format === 'PDF' || fileName.toLowerCase().endsWith('.pdf'))) {
        fileType = 'pdf';
      }

      // For audio files, if the URL is not a full CDN URL, resolve it through preview API
      if (fileType === 'audio' && !fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
        // The preview API redirects to the direct CDN URL
        const previewUrl = `/api/library/preview?path=${encodeURIComponent(fileUrl)}`;
        
        // For Capacitor native apps: use native viewer
        if (Capacitor.isNativePlatform()) {
          const baseUrl = 'https://app.suplient.com';
          const absoluteUrl = `${baseUrl}${previewUrl}`;
          const opened = await openFileInNativeViewer(absoluteUrl, fileName, fileType);
          if (opened) {
            toast.success(`Opening audio in native viewer...`);
            return;
          }
        }
        
        // Fall through to modal if native viewer fails
        setPreviewFile({ url: previewUrl, name: fileName });
        toast.success(`Opening audio preview...`);
        return;
      }

      // For Capacitor native apps: use native viewer for videos, audio, PDFs
      // For images: always use modal (better UX)
      if (Capacitor.isNativePlatform() && fileType !== 'image') {
        // For native apps, we need the absolute URL
        let nativeUrl = fileUrl;
        if (!nativeUrl.startsWith('http://') && !nativeUrl.startsWith('https://')) {
          const baseUrl = 'https://app.suplient.com';
          nativeUrl = `${baseUrl}/api/library/preview?path=${encodeURIComponent(fileUrl)}`;
        }
        const opened = await openFileInNativeViewer(nativeUrl, fileName, fileType);
        if (opened) {
          toast.success(`Opening ${fileType} in native viewer...`);
          return;
        }
        // Fall through to modal if native viewer fails
      }
      
      // For web or if native viewer failed: use modal
      // Images always use modal
      // If URL is not full, use preview API
      const previewUrl = fileUrl.startsWith('http://') || fileUrl.startsWith('https://') 
        ? fileUrl 
        : `/api/library/preview?path=${encodeURIComponent(fileUrl)}`;
      setPreviewFile({ url: previewUrl, name: fileName });
      toast.success(`Opening ${fileType} preview...`);
    } catch (error) {
      console.error('Error accessing file:', error);
      toast.error(error.message || t('library.accessFailed', 'Failed to access file'));
    }
  };

  // Handle file download
  const handleFileDownload = async (file) => {
    try {
      const response = await fetch(`/api/resources/${file.id}/access?action=download`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download file');
      }
      
      const data = await response.json();
      const downloadUrl = data.downloadUrl || data.resource.url;
      const fileName = data.fileName || file.fileName || file.title;
      
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(t('library.downloading', 'Downloading file...'));
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error(error.message || t('library.downloadFailed', 'Failed to download file'));
    }
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
          {isLoading ? (
            <Card className="p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">{t('library.loading', 'Loading shared files...')}</p>
              </div>
            </Card>
          ) : error ? (
            <Card className="p-8">
              <div className="text-center">
                <LibraryIcon className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('library.error', 'Error loading files')}</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline">
                  {t('common.buttons.tryAgain', 'Try Again')}
                </Button>
              </div>
            </Card>
          ) : filteredFiles.length === 0 ? (
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