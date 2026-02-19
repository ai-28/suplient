"use client"
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/app/context/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { 
  Video,
  Image,
  FileText,
  Volume2,
  Share2,
  Loader2,
  Music
} from "lucide-react";
import { FileExplorer } from "@/app/components/FileExplorer";

export function LibraryPickerModal({ open, onOpenChange, onShareFiles }) {
  const t = useTranslation();
  
  const categories = [
    { id: 'articles', name: t('library.articles', 'Articles'), icon: FileText, color: 'bg-blue-500' },
    { id: 'images', name: t('library.images', 'Images'), icon: Image, color: 'bg-green-500' },
    { id: 'videos', name: t('library.videos', 'Videos'), icon: Video, color: 'bg-purple-500' },
    { id: 'sounds', name: t('library.sounds', 'Sounds'), icon: Music, color: 'bg-orange-500' }
  ];
  
  const [selectedCategory, setSelectedCategory] = useState('articles');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [libraryFiles, setLibraryFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [folders, setFolders] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState(null);

  // Map category to resourceType
  const getResourceType = () => {
    const mapping = {
      videos: 'video',
      images: 'image',
      articles: 'article',
      sounds: 'sound'
    };
    return mapping[selectedCategory] || 'article';
  };

  // Fetch folders for the selected category
  const fetchFolders = useCallback(async () => {
    try {
      setLoadingFolders(true);
      const resourceType = getResourceType();
      const response = await fetch(`/api/library/folders?resourceType=${resourceType}&tree=true`);
      const data = await response.json();
      
      if (data.status) {
        setFolders(data.folders || []);
      } else {
        console.error('Failed to fetch folders:', data.message);
        setFolders([]);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
      setFolders([]);
    } finally {
      setLoadingFolders(false);
    }
  }, [selectedCategory]);

  // Fetch library files from API
  const fetchLibraryFiles = useCallback(async () => {
    try {
      setLoadingFiles(true);
      setError(null);
      const response = await fetch('/api/library/all');
      if (!response.ok) {
        throw new Error('Failed to fetch library resources');
      }
      const result = await response.json();
      if (result.status) {
        setLibraryFiles(result.resources || []);
      } else {
        throw new Error(result.message || 'Failed to fetch resources');
      }
    } catch (err) {
      console.error('Error fetching library files:', err);
      setError(err.message);
      setLibraryFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchLibraryFiles();
      fetchFolders();
    }
  }, [open, fetchLibraryFiles, fetchFolders]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const toggleFileSelection = (file) => {
    setSelectedFiles(prev => 
      prev.find(f => f.id === file.id)
        ? prev.filter(f => f.id !== file.id)
        : [...prev, file]
    );
  };

  const handleShare = async () => {
    try {
      setSharing(true);
      await onShareFiles(selectedFiles, "");
      setSelectedFiles([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error sharing files:', error);
      // Don't close modal on error, let user try again
    } finally {
      setSharing(false);
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setError(null);
    setSharing(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl w-full max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('library.shareFilesFromLibrary', 'Share Files from Library')}</DialogTitle>
        </DialogHeader>
        
        {/* Category Selection */}
        <div className="flex gap-2 border-b pb-3">
          {categories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "ghost"}
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setSelectedCategory(category.id)}
            >
              <category.icon className="h-4 w-4" />
              {category.name}
            </Button>
          ))}
        </div>
        
        {/* File Explorer */}
        <div className="flex-1 overflow-hidden mt-2">
          <FileExplorer
            files={libraryFiles}
            folders={folders}
            selectedFiles={selectedFiles}
            onFileSelect={toggleFileSelection}
            category={selectedCategory}
            loading={loadingFiles || loadingFolders}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
          <div className="flex items-center gap-2">
            {selectedFiles.length > 0 && (
              <Badge variant="secondary">
                {selectedFiles.length} {selectedFiles.length > 1 ? t('library.filesSelected', 'files selected') : t('library.fileSelected', 'file selected')}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              {t('common.buttons.cancel', 'Cancel')}
            </Button>
            <Button 
              onClick={handleShare}
              disabled={selectedFiles.length === 0 || sharing}
            >
              {sharing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('library.sharing', 'Sharing...')}
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('library.shareSelectedFiles', 'Share Selected Files')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
