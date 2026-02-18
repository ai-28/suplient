"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { PageHeader } from "@/app/components/PageHeader";
import { StatsCard } from "@/app/components/StatsCard";
import { 
  Library as LibraryIcon, 
  Video, 
  Image, 
  FileText, 
  Music, 
  FileImage,
  BookOpen,
  Plus,
  Eye,
  Files,
  HardDrive
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useTranslation } from "@/app/context/LanguageContext";

// Add cache-busting timestamp to force fresh image loading
const cacheBuster = Date.now();
const categoryVideos = "/assets/category-videos.webp";
const categoryImages = "/assets/category-images.webp";
const categoryArticles = "/assets/category-articles.webp";
const categorySounds = "/assets/category-sounds.webp";
const categoryTemplates = "/assets/category-templates.webp";
const categoryPrograms = "/assets/category-programs.webp";

// Helper function to format file size (needs translation function)
const formatFileSize = (bytes, t) => {
  // Convert to number and validate
  const numBytes = Number(bytes);
  
  // Handle invalid, NaN, Infinity, or zero values
  if (!numBytes || numBytes === 0 || !isFinite(numBytes) || isNaN(numBytes)) {
    const unit = t('library.fileSizeUnits.B', 'B') || 'B';
    return `0 ${unit}`;
  }
  
  // Cap at TB to prevent scientific notation for extremely large values
  const maxBytes = Math.pow(1024, 5); // 1 PB
  const clampedBytes = Math.min(numBytes, maxBytes);
  
  // Default size units as fallback
  const defaultSizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  
  const sizes = [
    t('library.fileSizeUnits.B', 'B') || 'B',
    t('library.fileSizeUnits.KB', 'KB') || 'KB',
    t('library.fileSizeUnits.MB', 'MB') || 'MB',
    t('library.fileSizeUnits.GB', 'GB') || 'GB',
    t('library.fileSizeUnits.TB', 'TB') || 'TB'
  ];
  
  // Calculate index and clamp it to valid array bounds
  const i = Math.min(
    Math.floor(Math.log(clampedBytes) / Math.log(1024)),
    sizes.length - 1
  );
  
  // Ensure index is not negative
  const index = Math.max(0, i);
  const size = (clampedBytes / Math.pow(1024, index)).toFixed(1);
  
  // Use default size unit if translation returns undefined/null/empty
  const unit = sizes[index] || defaultSizes[index] || 'B';
  
  return `${size} ${unit}`;
};

// Helper function to get total size in MB for calculations
const getSizeInMB = (bytes) => {
  if (!bytes || bytes === 0) return 0;
  return bytes / (1024 * 1024);
};

export default function Library() {
  const router = useRouter();
  const t = useTranslation();
  const [libraryItems, setLibraryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState(new Set());

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleCategoryClick = (categoryKey) => {
    router.push(`/coach/library/${categoryKey.toLowerCase()}`);
  };

  const handleImageError = (categoryKey) => {
    console.warn(`Failed to load image for category: ${categoryKey}`);
    setImageErrors(prev => new Set([...prev, categoryKey]));
  };

  // Fetch real data from API - get ALL files including those in nested folders
  useEffect(() => {
    const fetchLibraryData = async () => {
      try {
        setLoading(true);
        
        // Fetch ALL resources (including files in nested folders)
        const response = await fetch('/api/library/all');
        const data = await response.json();
        
        if (!data.status || !data.resources) {
          setLibraryItems([]);
          return;
        }

        // Get all resources and group by category
        const allResources = data.resources || [];
        
        // Group resources by category and calculate totals (includes files in nested folders)
        const videos = allResources.filter(r => r.category === 'videos');
        const images = allResources.filter(r => r.category === 'images');
        const articles = allResources.filter(r => r.category === 'articles');
        const sounds = allResources.filter(r => r.category === 'sounds');
        
        // Create library items with real data (including files in nested folders)
        const items = [
          {
            category: t('library.videos', 'Videos'),
            categoryKey: "videos",
            count: videos.length,
            icon: Video,
            color: "bg-primary",
            description: t('library.videos', 'Videos'),
            image: `${categoryVideos}?v=${cacheBuster}`,
            totalBytes: videos.reduce((sum, item) => sum + (Number(item.fileSize) || 0), 0),
            totalSize: formatFileSize(
              videos.reduce((sum, item) => sum + (Number(item.fileSize) || 0), 0),
              t
            )
          },
          {
            category: t('library.images', 'Images'),
            categoryKey: "images",
            count: images.length,
            icon: Image,
            color: "bg-accent",
            description: t('library.images', 'Images'),
            image: `${categoryImages}?v=${cacheBuster}`,
            totalBytes: images.reduce((sum, item) => sum + (Number(item.fileSize) || 0), 0),
            totalSize: formatFileSize(
              images.reduce((sum, item) => sum + (Number(item.fileSize) || 0), 0),
              t
            )
          },
          {
            category: t('library.articles', 'Articles'),
            categoryKey: "articles",
            count: articles.length,
            icon: FileText,
            color: "bg-secondary",
            description: t('library.articles', 'Articles'),
            image: `${categoryArticles}?v=${cacheBuster}`,
            totalBytes: articles.reduce((sum, item) => sum + (Number(item.fileSize) || 0), 0),
            totalSize: formatFileSize(
              articles.reduce((sum, item) => sum + (Number(item.fileSize) || 0), 0),
              t
            )
          },
          {
            category: t('library.sounds', 'Sounds'),
            categoryKey: "sounds",
            count: sounds.length,
            icon: Music,
            color: "bg-blue-teal",
            description: t('library.sounds', 'Sounds'),
            image: `${categorySounds}?v=${cacheBuster}`,
            totalBytes: sounds.reduce((sum, item) => sum + (Number(item.fileSize) || 0), 0),
            totalSize: formatFileSize(
              sounds.reduce((sum, item) => sum + (Number(item.fileSize) || 0), 0),
              t
            )
          }
        ];

        setLibraryItems(items);
      } catch (error) {
        console.error('Error fetching library data:', error);
        // Fallback to empty data
        setLibraryItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLibraryData();
  }, [t]);

  if (loading) {
    return (
      <div className={`page-container ${isMobile ? 'px-4' : ''}`}>
        <div className={`flex items-center justify-center ${isMobile ? 'h-48' : 'h-64'}`}>
          <div className="text-center">
            <div className={`animate-spin rounded-full ${isMobile ? 'h-6 w-6' : 'h-8 w-8'} border-b-2 border-primary mx-auto mb-4`}></div>
            <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>{t('common.messages.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`page-container ${isMobile ? 'px-4 pb-24' : ''}`}>
      {/* Page Header */}
      <div className={`flex items-start ${isMobile ? 'flex-col gap-3 mb-4' : 'justify-between mb-8'}`}>
        <div>
            <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-foreground ${isMobile ? 'mb-1' : 'mb-2'}`}>{t('navigation.library')}</h1>
          <p className={`text-muted-foreground ${isMobile ? 'text-xs' : ''}`}>{t('library.title')}</p>
        </div>
        <div className={`flex items-center ${isMobile ? 'w-full justify-between flex-wrap gap-2' : 'gap-3'}`}>
          <div className={`flex items-center ${isMobile ? 'gap-2 text-xs' : 'gap-4 text-sm'} bg-muted/50 rounded-md ${isMobile ? 'px-2 py-1.5 h-8' : 'px-4 py-2.5 h-10'}`}>
            <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-1.5'} text-muted-foreground`}>
              <Files className={isMobile ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
              <span className="font-medium text-foreground">{libraryItems.reduce((sum, item) => sum + item.count, 0)}</span>
              {!isMobile && <span>{t('library.resources')}</span>}
            </div>
            <div className={`w-px ${isMobile ? 'h-3' : 'h-4'} bg-border`}></div>
            <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-1.5'} text-muted-foreground`}>
              <HardDrive className={isMobile ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
              <span className="font-medium text-foreground">{formatFileSize(
                libraryItems.reduce((sum, item) => sum + (Number(item.totalBytes) || 0), 0),
                t
              )}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Library Grid */}
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
        {libraryItems.map((item) => (
          <Card 
            key={item.category} 
            className={`card-hover group overflow-hidden ${isMobile ? 'p-3' : ''}`}
          >
            <CardHeader className={`pb-3 ${isMobile ? 'px-0 pb-2' : ''}`}>
              <CardTitle className={`text-foreground flex items-center justify-between ${isMobile ? 'text-base' : 'text-lg'}`}>
                <span className={`flex items-center ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
                  <div className={`${item.color} rounded-lg ${isMobile ? 'p-1' : 'p-1.5'}`}>
                    <item.icon className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-white`} />
                  </div>
                  {item.category}
                </span>
                <Badge className={`bg-muted text-muted-foreground ${isMobile ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1'}`}>
                  {item.count}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className={`space-y-3 ${isMobile ? 'px-0 space-y-2' : ''}`}>
              <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground`}>
                {item.description}
              </p>
              
              {/* Content Preview */}
              <div 
                className={`bg-muted/30 rounded-lg ${isMobile ? 'p-2 min-h-[60px]' : 'p-3 min-h-[80px]'} flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors`}
                onClick={() => handleCategoryClick(item.categoryKey)}
              >
                {imageErrors.has(item.categoryKey) ? (
                  <div className={`${item.color} rounded-lg ${isMobile ? 'p-2' : 'p-4'} flex items-center justify-center`}>
                    <item.icon className={`${isMobile ? 'h-8 w-8' : 'h-12 w-12'} text-white`} />
                  </div>
                ) : (
                  <img 
                    src={item.image}
                    alt={item.category}
                    className="w-full h-full object-cover rounded"
                    onError={() => handleImageError(item.categoryKey)}
                    onLoad={() => console.log(`Image loaded for category: ${item.categoryKey}`)}
                  />
                )}
              </div>

              {/* Quick Actions */}
              <div className={`flex items-center ${isMobile ? 'flex-col gap-2' : 'justify-between'}`}>
                <div className={`flex items-center gap-2 ${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground`}>
                  <span>{item.count} {t('library.files', 'files')} • {item.totalSize}</span>
                </div>
                <Button 
                  variant="outline" 
                  size={isMobile ? "sm" : "sm"} 
                  onClick={() => handleCategoryClick(item.categoryKey)}
                  className={`${isMobile ? 'text-[10px] h-6 w-full' : 'text-xs h-7'}`}
                >
                  <Eye className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} ${isMobile ? 'mr-0.5' : 'mr-1'}`} />
                  {t('library.browse', 'Browse')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}