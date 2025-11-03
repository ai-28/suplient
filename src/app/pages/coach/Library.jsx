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

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(1);
  
  return `${size} ${sizes[i]}`;
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

  const handleCategoryClick = (categoryKey) => {
    router.push(`/coach/library/${categoryKey.toLowerCase()}`);
  };

  const handleImageError = (categoryKey) => {
    console.warn(`Failed to load image for category: ${categoryKey}`);
    setImageErrors(prev => new Set([...prev, categoryKey]));
  };

  // Fetch real data from API
  useEffect(() => {
    const fetchLibraryData = async () => {
      try {
        setLoading(true);
        
        // Fetch data from all categories
        const categories = ['videos', 'images', 'articles', 'sounds'];
        const promises = categories.map(async (category) => {
          try {
            const response = await fetch(`/api/library/${category}`);
            const data = await response.json();
            return {
              category,
              data: data.status ? data[category] || [] : []
            };
          } catch (error) {
            console.error(`Error fetching ${category}:`, error);
            return { category, data: [] };
          }
        });

        const results = await Promise.all(promises);
        
        // Create library items with real data
        const items = [
          {
            category: "Videos",
            categoryKey: "videos",
            count: results.find(r => r.category === 'videos')?.data?.length || 0,
            icon: Video,
            color: "bg-primary",
            description: "Videos",
            image: `${categoryVideos}?v=${cacheBuster}`,
            totalSize: formatFileSize(
              results.find(r => r.category === 'videos')?.data?.reduce((sum, item) => sum + (item.fileSize || 0), 0) || 0
            )
          },
          {
            category: "Images", 
            categoryKey: "images",
            count: results.find(r => r.category === 'images')?.data?.length || 0,
            icon: Image,
            color: "bg-accent",
            description: "Images",
            image: `${categoryImages}?v=${cacheBuster}`,
            totalSize: formatFileSize(
              results.find(r => r.category === 'images')?.data?.reduce((sum, item) => sum + (item.fileSize || 0), 0) || 0
            )
          },
          {
            category: "Articles",
            categoryKey: "articles",
            count: results.find(r => r.category === 'articles')?.data?.length || 0,
            icon: FileText,
            color: "bg-secondary",
            description: "Articles",
            image: `${categoryArticles}?v=${cacheBuster}`,
            totalSize: formatFileSize(
              results.find(r => r.category === 'articles')?.data?.reduce((sum, item) => sum + (item.fileSize || 0), 0) || 0
            )
          },
          {
            category: "Sounds",
            categoryKey: "sounds",
            count: results.find(r => r.category === 'sounds')?.data?.length || 0,
            icon: Music,
            color: "bg-blue-teal",
            description: "Sounds",
            image: `${categorySounds}?v=${cacheBuster}`,
            totalSize: formatFileSize(
              results.find(r => r.category === 'sounds')?.data?.reduce((sum, item) => sum + (item.fileSize || 0), 0) || 0
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
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('common.messages.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{t('navigation.library')}</h1>
          <p className="text-muted-foreground">{t('library.title')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 text-sm bg-muted/50 rounded-md px-4 py-2.5 h-10">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Files className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">{libraryItems.reduce((sum, item) => sum + item.count, 0)}</span>
              <span>resources</span>
            </div>
            <div className="w-px h-4 bg-border"></div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <HardDrive className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">{formatFileSize(
                libraryItems.reduce((sum, item) => {
                  // Parse the formatted size back to bytes for calculation
                  const sizeStr = item.totalSize;
                  const size = parseFloat(sizeStr.replace(/[^\d.]/g, ''));
                  const unit = sizeStr.includes('GB') ? size * 1024 * 1024 * 1024 :
                             sizeStr.includes('MB') ? size * 1024 * 1024 :
                             sizeStr.includes('KB') ? size * 1024 : size;
                  return sum + size;
                }, 0)
              )}</span>
            </div>
          </div>
            <Button onClick={() => router.push('/coach/library/upload')} className="bg-gradient-primary text-[#1A2D4D] shadow-medium hover:shadow-strong transition-all flex items-center gap-2">
            <Plus className="h-4 w-4 text-[#1A2D4D]" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Library Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {libraryItems.map((item) => (
          <Card 
            key={item.category} 
            className="card-hover group overflow-hidden"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <div className={`${item.color} rounded-lg p-1.5`}>
                    <item.icon className="h-4 w-4 text-white" />
                  </div>
                  {item.category}
                </span>
                <Badge className="bg-muted text-muted-foreground text-sm px-2 py-1">
                  {item.count}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
              
              {/* Content Preview */}
              <div 
                className="bg-muted/30 rounded-lg p-3 min-h-[80px] flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleCategoryClick(item.categoryKey)}
              >
                {imageErrors.has(item.categoryKey) ? (
                  <div className={`${item.color} rounded-lg p-4 flex items-center justify-center`}>
                    <item.icon className="h-12 w-12 text-white" />
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{item.count} files • {item.totalSize}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleCategoryClick(item.categoryKey)}
                  className="text-xs h-7"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Browse
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}