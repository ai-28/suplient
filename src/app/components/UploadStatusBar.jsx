"use client"

import { useState, useEffect } from 'react';
import { useUploadManager } from '@/app/context/UploadManagerContext';
import { Button } from '@/app/components/ui/button';
import { Progress } from '@/app/components/ui/progress';
import { X, ChevronUp, ChevronDown, Loader2, CheckCircle2, AlertCircle, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useTranslation } from '@/app/context/LanguageContext';

export function UploadStatusBar() {
  const { uploads, cancelUpload, removeUpload } = useUploadManager();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const t = useTranslation();

  const activeUploads = uploads.filter(u => u.status === 'uploading' || u.status === 'pending');
  const completedUploads = uploads.filter(u => u.status === 'completed');
  const failedUploads = uploads.filter(u => u.status === 'failed');
  const cancelledUploads = uploads.filter(u => u.status === 'cancelled');

  const hasActiveUploads = activeUploads.length > 0;
  const hasCompletedOrFailed = completedUploads.length > 0 || failedUploads.length > 0;

  // Auto-expand if there are active uploads
  useEffect(() => {
    if (hasActiveUploads && !isExpanded) {
      setIsExpanded(true);
      setIsMinimized(false);
    }
  }, [hasActiveUploads, isExpanded]);

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

  // Calculate time remaining (simple estimation)
  const calculateTimeRemaining = () => {
    if (activeUploads.length === 0) return null;
    
    const avgProgress = activeUploads.reduce((sum, u) => sum + (u.progress || 0), 0) / activeUploads.length;
    if (avgProgress === 0 || avgProgress === 100) return null;
    
    // Estimate based on average progress and elapsed time
    const avgElapsed = activeUploads.reduce((sum, u) => {
      if (u.startTime) {
        return sum + (Date.now() - u.startTime);
      }
      return sum;
    }, 0) / activeUploads.length;
    
    if (avgElapsed === 0) return null;
    
    const estimatedTotal = avgElapsed / (avgProgress / 100);
    const remaining = estimatedTotal - avgElapsed;
    
    if (remaining < 1000) return t('uploadStatusBar.almostDone', 'Almost done...');
    if (remaining < 60000) {
      const seconds = Math.ceil(remaining / 1000);
      return t('uploadStatusBar.secondsRemaining', '{seconds} seconds remaining...').replace('{seconds}', seconds.toString());
    }
    const minutes = Math.ceil(remaining / 60000);
    return t('uploadStatusBar.minutesRemaining', '{minutes} minute{plural} remaining...')
      .replace('{minutes}', minutes.toString())
      .replace('{plural}', minutes !== 1 ? 's' : '');
  };

  const timeRemaining = calculateTimeRemaining();
  const totalActive = activeUploads.length;

  // Minimized view
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-80 bg-card border rounded-lg shadow-xl">
        <div 
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setIsMinimized(false)}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {hasActiveUploads ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                <span className="text-sm font-medium truncate">
                  {totalActive} {totalActive === 1 ? t('uploadStatusBar.file', 'file') : t('uploadStatusBar.files', 'files')} {t('uploadStatusBar.uploading', 'uploading')}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm font-medium">
                  {completedUploads.length} {t('uploadStatusBar.completed', 'completed')}
                </span>
              </>
            )}
          </div>
          <Maximize2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-card border rounded-lg shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {hasActiveUploads ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
              <span className="text-sm font-medium">
                {totalActive} {totalActive === 1 ? t('uploadStatusBar.item', 'item') : t('uploadStatusBar.items', 'items')} {t('uploadStatusBar.uploading', 'uploading')}
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm font-medium">
                {completedUploads.length} {completedUploads.length === 1 ? t('uploadStatusBar.item', 'item') : t('uploadStatusBar.items', 'items')} {t('uploadStatusBar.completed', 'completed')}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsMinimized(true)}
            title={t('uploadStatusBar.minimize', 'Minimize')}
          >
            <Minimize2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => {
              // Cancel all active uploads
              activeUploads.forEach(upload => cancelUpload(upload.id));
            }}
            title={t('uploadStatusBar.cancelAll', 'Cancel all')}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Time Remaining */}
      {hasActiveUploads && timeRemaining && (
        <div className="px-3 py-2 bg-muted/50 border-b">
          <p className="text-xs text-muted-foreground">{timeRemaining}</p>
        </div>
      )}

      {/* File List */}
      <div className="max-h-[400px] overflow-y-auto">
        <div className="p-2 space-y-1">
          {/* Active Uploads */}
          {activeUploads.map((upload, index) => {
            const progress = upload.progress || 0;
            const circumference = 2 * Math.PI * 8; // radius = 8
            const offset = circumference - (progress / 100) * circumference;
            
            return (
              <div key={upload.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors">
                {/* Circular Progress Ring */}
                <div className="relative flex-shrink-0">
                  <svg className="w-5 h-5 transform -rotate-90" viewBox="0 0 20 20">
                    {/* Background circle */}
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-muted-foreground/20"
                    />
                    {/* Progress circle */}
                    {upload.status === 'uploading' ? (
                      <circle
                        cx="10"
                        cy="10"
                        r="8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="text-primary transition-all duration-300"
                      />
                    ) : (
                      <circle
                        cx="10"
                        cy="10"
                        r="8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-muted-foreground/30"
                      />
                    )}
                  </svg>
                  {/* Center icon or percentage */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {upload.status === 'uploading' ? (
                      <span className="text-[8px] font-medium text-primary">
                        {Math.round(progress)}%
                      </span>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{upload.fileName || upload.title}</p>
                </div>
              </div>
            );
          })}

          {/* Completed Uploads - Show briefly then auto-remove */}
          {completedUploads.slice(0, 3).map((upload) => (
            <div key={upload.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors">
              {/* Completed Circle with Checkmark */}
              <div className="relative flex-shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 20 20">
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    fill="currentColor"
                    className="text-green-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-white" fill="currentColor" />
                </div>
              </div>
              <p className="text-sm font-medium truncate flex-1">{upload.fileName || upload.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
