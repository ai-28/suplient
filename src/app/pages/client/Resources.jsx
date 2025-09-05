"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Search, BookOpen, Play, Download, Heart, Star, Filter } from "lucide-react";
import { useState, useEffect } from "react";

const categories = ["Videos", "Images", "Articles", "Sounds"];

const resources = [
  {
    id: 1,
    title: "Understanding Anxiety",
    description: "Learn about the causes and symptoms of anxiety disorders.",
    type: "Article",
    category: "Articles",
    duration: "5 min read",
    rating: 4.8,
    liked: true,
    completed: true
  },
  {
    id: 2,
    title: "Deep Breathing Exercise",
    description: "A guided breathing exercise to help reduce stress and anxiety.",
    type: "Exercise",
    category: "Exercises",
    duration: "10 min",
    rating: 4.9,
    liked: false,
    completed: false
  },
  {
    id: 3,
    title: "Mindfulness Meditation",
    description: "Introduction to mindfulness meditation practices.",
    type: "Video",
    category: "Videos",
    duration: "15 min",
    rating: 4.7,
    liked: true,
    completed: true
  },
  {
    id: 4,
    title: "Daily Mood Tracker",
    description: "Track your daily mood and identify patterns.",
    type: "Worksheet",
    category: "Worksheets",
    duration: "Daily use",
    rating: 4.6,
    liked: false,
    completed: false
  },
  {
    id: 5,
    title: "Sleep Meditation Audio",
    description: "Relaxing audio to help you fall asleep peacefully.",
    type: "Audio",
    category: "Audio",
    duration: "20 min",
    rating: 4.8,
    liked: true,
    completed: false
  }
];

export default function ClientResources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Videos");
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check on mount
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Article': return <BookOpen className="h-4 w-4" />;
      case 'Video': return <Play className="h-4 w-4" />;
      case 'Exercise': return <Heart className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Article': return 'default';
      case 'Video': return 'secondary';
      case 'Exercise': return 'outline';
      case 'Audio': return 'secondary';
      case 'Worksheet': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className={`container mx-auto ${isMobile ? 'px-3 py-4' : 'px-4 py-6'} space-y-6`}>
        <div>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold tracking-tight`}>Resources</h1>
          <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
            Access helpful articles, exercises, and tools for your mental health journey.
          </p>
        </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className={`relative ${isMobile ? 'w-full' : 'max-w-md'}`}>
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-10 ${isMobile ? 'h-12 text-base' : ''}`}
          />
        </div>

        {isMobile ? (
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex space-x-2 pb-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="shrink-0 h-9 px-4"
                >
                  {category}
                </Button>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Resources Grid */}
      <div className={`${isMobile ? 'space-y-3' : 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'}`}>
        {filteredResources.map((resource) => (
          <Card key={resource.id} className={`${resource.completed ? "bg-muted/30" : ""} ${isMobile ? 'overflow-hidden' : ''}`}>
            {isMobile ? (
              // Mobile horizontal layout
              <div className="flex p-4">
                <div className="flex-shrink-0 mr-4 flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                  {getTypeIcon(resource.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getTypeColor(resource.type)} className="text-xs">
                      {resource.type}
                    </Badge>
                    {resource.completed && (
                      <Badge variant="secondary" className="text-xs">Completed</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-base mb-1 truncate">{resource.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{resource.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">{resource.duration}</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-xs">{resource.rating}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="flex-1 h-9">
                      {resource.type === 'Video' || resource.type === 'Audio' ? 'Play' : 'Read'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-9 w-9 ${resource.liked ? "text-red-500" : ""}`}
                    >
                      <Heart className={`h-4 w-4 ${resource.liked ? "fill-current" : ""}`} />
                    </Button>
                    <Button size="sm" variant="outline" className="h-9 w-9">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              // Desktop card layout
              <>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getTypeColor(resource.type)}>
                          {getTypeIcon(resource.type)}
                          <span className="ml-1">{resource.type}</span>
                        </Badge>
                        {resource.completed && (
                          <Badge variant="secondary">Completed</Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                      <CardDescription>{resource.description}</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={resource.liked ? "text-red-500" : ""}
                    >
                      <Heart className={`h-4 w-4 ${resource.liked ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">{resource.duration}</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm">{resource.rating}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      {resource.type === 'Video' || resource.type === 'Audio' ? 'Play' : 'Read'}
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        ))}
      </div>

      {/* No resources message */}
      {filteredResources.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No resources found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}