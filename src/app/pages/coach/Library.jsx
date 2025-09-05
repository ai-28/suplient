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
import { useState } from "react";

// Add cache-busting timestamp to force fresh image loading
const cacheBuster = Date.now();
const categoryVideos = "/assets/category-videos.webp";
const categoryImages = "/assets/category-images.webp";
const categoryArticles = "/assets/category-articles.webp";
const categorySounds = "/assets/category-sounds.webp";
const categoryTemplates = "/assets/category-templates.webp";
const categoryPrograms = "/assets/category-programs.webp";

const getLibraryItems = () => [
  {
    category: "Videos",
    categoryKey: "videos",
    count: 18,
    icon: Video,
    color: "bg-primary",
    description: "Videos",
    image: `${categoryVideos}?v=${cacheBuster}`,
    totalSize: "2.4 GB"
  },
  {
    category: "Images", 
    categoryKey: "images",
    count: 162,
    icon: Image,
    color: "bg-accent",
    description: "Images",
    image: `${categoryImages}?v=${cacheBuster}`,
    totalSize: "1.8 GB"
  },
  {
    category: "Articles",
    categoryKey: "articles",
    count: 15,
    icon: FileText,
    color: "bg-secondary",
    description: "Articles",
    image: `${categoryArticles}?v=${cacheBuster}`,
    totalSize: "245 MB"
  },
  {
    category: "Sounds",
    categoryKey: "sounds",
    count: 20,
    icon: Music,
    color: "bg-blue-teal",
    description: "Sounds",
    image: `${categorySounds}?v=${cacheBuster}`,
    totalSize: "1.1 GB"
  }
];

export default function Library() {
  const router = useRouter();
  const libraryItems = getLibraryItems();
  const [imageErrors, setImageErrors] = useState(new Set());

  const handleCategoryClick = (categoryKey) => {
    router.push(`/coach/library/${categoryKey.toLowerCase()}`);
  };

  const handleImageError = (categoryKey) => {
    console.warn(`Failed to load image for category: ${categoryKey}`);
    setImageErrors(prev => new Set([...prev, categoryKey]));
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Library</h1>
          <p className="text-muted-foreground">Manage your library of resources</p>
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
              <span className="font-medium text-foreground">{libraryItems.reduce((sum, item) => {
                const size = parseFloat(item.totalSize.replace(/[^\d.]/g, ''));
                const unit = item.totalSize.includes('GB') ? size * 1024 : size;
                return sum + unit;
              }, 0).toFixed(1)} GB</span>
            </div>
          </div>
            <Button onClick={() => router.push('/coach/library/upload')} className="bg-gradient-primary text-white shadow-medium hover:shadow-strong transition-all flex items-center gap-2">
            <Plus className="h-4 w-4" />
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