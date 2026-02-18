"use client"

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/app/context/LanguageContext";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Badge } from "@/app/components/ui/badge";
import { FileText, Image, Video, Music, Folder, FolderOpen, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/app/lib/utils";

export function FileExplorer({
  files = [],
  folders = [],
  selectedFiles = [],
  onFileSelect,
  category,
  loading = false
}) {
  const t = useTranslation();
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [filteredFiles, setFilteredFiles] = useState([]);

  // Build folder tree structure recursively
  const buildFolderTree = useCallback((folders) => {
    const folderMap = new Map();
    const rootFolders = [];

    // Create map of all folders with children array
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    // Build tree structure
    folders.forEach(folder => {
      if (folder.parentFolderId) {
        const parent = folderMap.get(folder.parentFolderId);
        if (parent) {
          parent.children.push(folderMap.get(folder.id));
        } else {
          // Parent not found, treat as root
          rootFolders.push(folderMap.get(folder.id));
        }
      } else {
        // No parent, it's a root folder
        rootFolders.push(folderMap.get(folder.id));
      }
    });

    // Sort children recursively
    const sortFolders = (folderList) => {
      folderList.forEach(folder => {
        if (folder.children && folder.children.length > 0) {
          folder.children.sort((a, b) => a.name.localeCompare(b.name));
          sortFolders(folder.children);
        }
      });
      folderList.sort((a, b) => a.name.localeCompare(b.name));
    };

    sortFolders(rootFolders);
    return rootFolders;
  }, []);

  const folderTree = buildFolderTree(folders);

  // Filter files by selected folder and category
  useEffect(() => {
    const filtered = files.filter(file => {
      const matchesCategory = file.category === category;
      const matchesFolder = selectedFolderId === null 
        ? !file.folderId 
        : file.folderId === selectedFolderId;
      return matchesCategory && matchesFolder;
    });
    setFilteredFiles(filtered);
  }, [files, selectedFolderId, category]);

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleFolderClick = (folderId) => {
    setSelectedFolderId(folderId);
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'audio': case 'mp3': return <Music className="h-4 w-4" />;
      case 'video': case 'mp4': return <Video className="h-4 w-4" />;
      case 'image': case 'jpg': case 'png': return <Image className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const renderFolderTree = (folders, level = 0) => {
    if (!folders || folders.length === 0) return null;

    return folders.map(folder => {
      const isExpanded = expandedFolders.has(folder.id);
      const isSelected = selectedFolderId === folder.id;
      const hasChildren = folder.children && folder.children.length > 0;

      return (
        <div key={folder.id}>
          <div
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent transition-colors",
              isSelected && "bg-accent",
              level > 0 && "ml-4"
            )}
            onClick={() => handleFolderClick(folder.id)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) {
                  toggleFolder(folder.id);
                }
              }}
              className={cn(
                "flex items-center justify-center w-4 h-4 flex-shrink-0",
                !hasChildren && "invisible"
              )}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-primary flex-shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-primary flex-shrink-0" />
            )}
            <span className="text-sm flex-1 truncate">{folder.name}</span>
          </div>
          {isExpanded && hasChildren && (
            <div className="ml-2">
              {renderFolderTree(folder.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex gap-4 h-[400px] border rounded-lg">
      {/* Left Pane - Folder Tree */}
      <div className="w-64 border-r bg-muted/30">
        <div className="p-3 border-b">
          <h3 className="text-sm font-semibold">{t('library.folders', 'Folders')}</h3>
        </div>
        <ScrollArea className="h-[calc(100%-60px)]">
          <div className="p-2 space-y-1">
            {/* Root level (no folder) */}
            <div
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent transition-colors",
                selectedFolderId === null && "bg-accent"
              )}
              onClick={() => handleFolderClick(null)}
            >
              <Folder className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm flex-1 truncate">{t('library.rootFolder', 'Root')}</span>
            </div>
            {/* Folder tree */}
            {renderFolderTree(folderTree)}
          </div>
        </ScrollArea>
      </div>

      {/* Right Pane - Files */}
      <div className="flex-1 flex flex-col">
        <div className="p-3 border-b">
          <h3 className="text-sm font-semibold">
            {selectedFolderId === null 
              ? t('library.filesInRoot', 'Files in Root')
              : t('library.filesInFolder', 'Files in Folder')}
          </h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">{t('library.loadingFiles', 'Loading files...')}</p>
                </div>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t('library.noFilesInFolder', 'No files found in this folder')}
                  </p>
                </div>
              </div>
            ) : (
              filteredFiles.map(file => {
                const isSelected = selectedFiles.some(f => f.id === file.id);
                return (
                  <div
                    key={file.id}
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors",
                      isSelected && "bg-accent border-primary"
                    )}
                    onClick={() => onFileSelect(file)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onFileSelect(file)}
                    />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getFileIcon(file.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{file.size}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      {file.type}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
