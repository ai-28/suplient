"use client"

import { useState } from 'react';
import { useUploadManager } from '@/app/context/UploadManagerContext';
import { Button } from '@/app/components/ui/button';
import { Progress } from '@/app/components/ui/progress';
import { X, ChevronUp, ChevronDown, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useTranslation } from '@/app/context/LanguageContext';

export function UploadStatusBar() {
  const { uploads, cancelUpload, removeUpload } = useUploadManager();
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useTranslation();

  const activeUploads = uploads.filter(u => u.status === 'uploading');
  const completedUploads = uploads.filter(u => u.status === 'completed');
  const failedUploads = uploads.filter(u => u.status === 'failed');
  const cancelledUploads = uploads.filter(u => u.status === 'cancelled');

  const hasActiveUploads = activeUploads.length > 0;
  const hasCompletedOrFailed = completedUploads.length > 0 || failedUploads.length > 0;

  // Auto-expand if there are active uploads
  if (hasActiveUploads && !isExpanded) {
    setIsExpanded(true);
  }

  // Don't show if no uploads
  if (uploads.length === 0) {
    return null;
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
      {/* Collapsed View - Summary Bar */}
      <div 
        className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {hasActiveUploads ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">
                {activeUploads.length} {activeUploads.length === 1 ? 'file' : 'files'} uploading...
              </span>
              {activeUploads[0] && (
                <span className="text-xs text-muted-foreground truncate">
                  {activeUploads[0].fileName}
                </span>
              )}
            </>
          ) : hasCompletedOrFailed ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">
                {completedUploads.length > 0 && `${completedUploads.length} completed`}
                {completedUploads.length > 0 && failedUploads.length > 0 && ', '}
                {failedUploads.length > 0 && `${failedUploads.length} failed`}
              </span>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded View - Detailed List */}
      {isExpanded && (
        <div className="max-h-[300px] overflow-y-auto border-t">
          <div className="p-4 space-y-3">
            {/* Active Uploads */}
            {activeUploads.map((upload) => (
              <div key={upload.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{upload.fileName}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatFileSize(upload.fileSize)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelUpload(upload.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <Progress value={upload.progress} className="h-1.5" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{upload.progress.toFixed(0)}%</span>
                  {upload.fileSize && (
                    <span>
                      {formatFileSize((upload.fileSize * upload.progress) / 100)} / {formatFileSize(upload.fileSize)}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Completed Uploads */}
            {completedUploads.map((upload) => (
              <div key={upload.id} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm truncate">{upload.fileName}</span>
                  <span className="text-xs text-muted-foreground">- Completed</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeUpload(upload.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {/* Failed Uploads */}
            {failedUploads.map((upload) => (
              <div key={upload.id} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span className="text-sm truncate">{upload.fileName}</span>
                  <span className="text-xs text-muted-foreground">- Failed</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeUpload(upload.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {/* Cancelled Uploads */}
            {cancelledUploads.map((upload) => (
              <div key={upload.id} className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate">{upload.fileName}</span>
                  <span className="text-xs text-muted-foreground">- Cancelled</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeUpload(upload.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {/* Clear All Completed/Failed */}
            {(completedUploads.length > 0 || failedUploads.length > 0 || cancelledUploads.length > 0) && (
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    [...completedUploads, ...failedUploads, ...cancelledUploads].forEach(upload => {
                      removeUpload(upload.id);
                    });
                  }}
                >
                  Clear completed
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
