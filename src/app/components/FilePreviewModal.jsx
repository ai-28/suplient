"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { isNative } from '@/lib/capacitor';

export function FilePreviewModal({ 
  open, 
  onOpenChange, 
  fileUrl, 
  fileName = '',
  isMobile = false 
}) {
  const [pdfError, setPdfError] = useState(false);
  const [isMobileNative, setIsMobileNative] = useState(false);

  // Check if running on native mobile (iOS/Android Capacitor)
  useEffect(() => {
    setIsMobileNative(isNative());
  }, []);

  // Lock body scroll when modal is open (especially important for Capacitor)
  useEffect(() => {
    if (open && isMobileNative) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
        document.documentElement.style.overflow = originalStyle;
      };
    }
  }, [open, isMobileNative]);

  if (!open || !fileUrl) return null;

  // Determine file type based on file extension
  const getFileType = (url, name) => {
    // Try to get extension from fileName first, then from URL
    let fileExtension = '';
    
    if (name) {
      const nameParts = name.split('.');
      if (nameParts.length > 1) {
        fileExtension = nameParts.pop()?.toLowerCase() || '';
      }
    }
    
    // If no extension from name, try URL
    if (!fileExtension) {
      const urlParts = url.split('/').pop() || '';
      const urlExtension = urlParts.split('.').pop()?.toLowerCase() || '';
      // Remove query params if any
      fileExtension = urlExtension.split('?')[0];
    }
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension)) {
      return 'images';
    } else if (['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(fileExtension)) {
      return 'videos';
    } else if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(fileExtension)) {
      return 'sounds';
    } else if (fileExtension === 'pdf') {
      return 'pdf';
    } else if (['doc', 'docx', 'txt', 'rtf'].includes(fileExtension)) {
      return 'document';
    }
    return 'document'; // Default fallback
  };

  const previewType = getFileType(fileUrl, fileName);

  // Determine the preview URL - use direct URL if it's already a full URL, otherwise use preview API
  const getPreviewUrl = (url) => {
    // If URL is already a full URL (starts with http/https), use it directly
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Otherwise, use the preview API for library paths
    return `/api/library/preview?path=${encodeURIComponent(url)}`;
  };

  const previewUrl = getPreviewUrl(fileUrl);
  
  // For PDFs, also try preview API as fallback
  const pdfPreviewUrl = previewType === 'pdf' && fileUrl.startsWith('http') 
    ? `/api/library/preview?path=${encodeURIComponent(fileUrl)}`
    : previewUrl;

  // Use native mobile detection or passed prop
  const isMobileView = isMobile || isMobileNative;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`${isMobileView ? 'max-w-full w-full h-full max-h-full m-0 p-0' : 'max-w-4xl max-h-[90vh]'} overflow-hidden`}
        style={isMobileView ? {
          // Full screen on mobile native
          height: '100vh',
          maxHeight: '100vh',
          borderRadius: 0,
        } : {}}
        onInteractOutside={(e) => {
          // Allow closing on outside click
          onOpenChange(false);
        }}
        onEscapeKeyDown={(e) => {
          // Allow closing with Escape key
          onOpenChange(false);
        }}
      >
        {/* Hide default close button and use custom one */}
        <style dangerouslySetInnerHTML={{
          __html: `
            [data-radix-dialog-content] > button:not([data-custom-close]) {
              display: none !important;
            }
          `
        }} />
        <DialogHeader className={`${isMobileView ? 'p-3' : 'p-4'} border-b flex-shrink-0`}>
          <div className="flex items-center justify-between">
            <DialogTitle className={`${isMobileView ? 'text-sm' : 'text-lg'} font-semibold break-words flex-1 pr-2`} style={{ color: '#1A2D4D' }}>
              {fileName || 'Preview'}
            </DialogTitle>
            <Button 
              variant="ghost" 
              size={isMobileView ? "sm" : "sm"}
              className={isMobileView ? 'h-8 w-8 p-0 flex-shrink-0' : ''}
              data-custom-close="true"
              style={{ color: '#1A2D4D' }}
              onClick={() => {
                setPdfError(false);
                onOpenChange(false);
              }}
            >
              ✕
            </Button>
          </div>
        </DialogHeader>
        <div className={`${isMobileView ? 'p-2' : 'p-4'} overflow-y-auto flex-1`} style={isMobileView ? { maxHeight: 'calc(100vh - 60px)' } : {}}>
          {previewType === 'images' ? (
            <div>
              <img 
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-[70vh] object-contain mx-auto"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.className = 'text-center py-8';
                  fallback.innerHTML = `
                    <p class="mb-4" style="color: #1A2D4D;">Preview failed to load</p>
                    <button 
                      class="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                      onclick="window.open('${fileUrl}', '_blank')"
                    >
                      Open in New Tab
                    </button>
                  `;
                  e.target.parentNode.appendChild(fallback);
                }}
              />
            </div>
          ) : previewType === 'videos' ? (
            <video 
              src={previewUrl}
              controls
              className="max-w-full max-h-[70vh] mx-auto"
              onError={(e) => {
                e.target.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'text-center py-8';
                fallback.innerHTML = `
                  <p class="mb-4" style="color: #1A2D4D;">Video failed to load</p>
                  <button 
                    class="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                    onclick="window.open('${fileUrl}', '_blank')"
                  >
                    Open in New Tab
                  </button>
                `;
                e.target.parentNode.appendChild(fallback);
              }}
            />
          ) : previewType === 'sounds' ? (
            <audio 
              src={previewUrl}
              controls
              className="w-full"
              onError={(e) => {
                e.target.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'text-center py-8';
                fallback.innerHTML = `
                  <p class="mb-4" style="color: #1A2D4D;">Audio failed to load</p>
                  <button 
                    class="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                    onclick="window.open('${fileUrl}', '_blank')"
                  >
                    Open in New Tab
                  </button>
                `;
                e.target.parentNode.appendChild(fallback);
              }}
            />
          ) : previewType === 'pdf' ? (
            <div>
              <div className={isMobileView ? 'mb-2' : 'mb-4'}>
                {pdfError ? (
                  <div className="text-center py-8">
                    <p className={`${isMobileView ? 'text-xs' : 'text-sm'} mb-4`} style={{ color: '#1A2D4D' }}>
                      PDF preview failed to load in iframe
                    </p>
                    <p className={`${isMobileView ? 'text-[10px]' : 'text-xs'} mb-4`} style={{ color: '#1A2D4D' }}>
                      This may be due to browser security settings. Please use the button below to open in a new tab.
                    </p>
                  </div>
                ) : (
                  <iframe
                    src={previewUrl}
                    className={`w-full ${isMobileView ? 'h-[50vh]' : 'h-[60vh]'} border rounded`}
                    title="PDF Preview"
                    onLoad={() => {
                      setPdfError(false);
                    }}
                    onError={() => {
                      setPdfError(true);
                    }}
                  />
                )}
              </div>
              <div className="text-center space-y-2">
                {pdfError && (
                  <Button 
                    variant="outline" 
                    className={`w-full ${isMobileView ? 'text-xs h-8' : ''}`}
                    size={isMobileView ? "sm" : "default"}
                    style={{ color: '#1A2D4D' }}
                    onClick={() => {
                      setPdfError(false);
                      // Try preview API as fallback
                      const fallbackUrl = pdfPreviewUrl !== previewUrl ? pdfPreviewUrl : previewUrl;
                      window.open(fallbackUrl, '_blank');
                    }}
                  >
                    Try Preview API
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className={`w-full ${isMobileView ? 'text-xs h-8' : ''}`}
                  size={isMobileView ? "sm" : "default"}
                  style={{ color: '#1A2D4D' }}
                  onClick={() => {
                    window.open(previewUrl, '_blank');
                  }}
                >
                  Open in New Tab
                </Button>
              </div>
            </div>
          ) : previewType === 'document' ? (
            <div>
              <div className={isMobileView ? 'mb-2' : 'mb-4'}>
                <div className={`text-center ${isMobileView ? 'py-4' : 'py-8'}`}>
                  <p className={`${isMobileView ? 'text-xs' : 'text-sm'} mb-2 break-words`} style={{ color: '#1A2D4D' }}>
                    Document preview not available
                  </p>
                  <p className={`${isMobileView ? 'text-[10px]' : 'text-xs'} mb-2 break-words`} style={{ color: '#1A2D4D' }}>
                    This file type cannot be previewed inline. Please download or open in a new tab.
                  </p>
                </div>
              </div>
              <div className={isMobileView ? 'space-y-2' : 'space-y-3'}>
                <Button 
                  variant="outline" 
                  className={`w-full ${isMobileView ? 'text-xs h-8' : ''}`}
                  size={isMobileView ? "sm" : "default"}
                  style={{ color: '#1A2D4D' }}
                  onClick={() => {
                    window.open(previewUrl, '_blank');
                  }}
                >
                  Open in New Tab
                </Button>
                {fileUrl.startsWith('http://') || fileUrl.startsWith('https://') ? (
                  <Button 
                    variant="outline" 
                    className={`w-full ${isMobileView ? 'text-xs h-8' : ''}`}
                    size={isMobileView ? "sm" : "default"}
                    style={{ color: '#1A2D4D' }}
                    onClick={() => {
                      window.open(fileUrl, '_blank');
                    }}
                  >
                    Open Original URL
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className={`text-center ${isMobileView ? 'py-4' : 'py-8'}`}>
              <p className={`${isMobileView ? 'text-xs' : 'text-sm'} mb-2 break-words`} style={{ color: '#1A2D4D' }}>
                Preview not available for this file type
              </p>
              <Button 
                variant="outline" 
                className={`mt-4 ${isMobileView ? 'text-xs h-8' : ''}`}
                size={isMobileView ? "sm" : "default"}
                style={{ color: '#1A2D4D' }}
                onClick={() => window.open(fileUrl, '_blank')}
              >
                Open in New Tab
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
