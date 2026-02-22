"use client"

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/app/components/ui/button';
import { X } from 'lucide-react';

export function FilePreviewModal({ 
  open, 
  onOpenChange, 
  fileUrl, 
  fileName = '',
  isMobile = false 
}) {
  const [pdfError, setPdfError] = useState(false);

  // Prevent body scroll and horizontal overflow when modal is open on mobile
  useEffect(() => {
    if (open && isMobile) {
      // Save current overflow styles
      const bodyOriginalOverflow = window.getComputedStyle(document.body).overflow;
      const bodyOriginalOverflowX = window.getComputedStyle(document.body).overflowX;
      const htmlOriginalOverflowX = window.getComputedStyle(document.documentElement).overflowX;
      
      // Lock body scroll and prevent horizontal overflow
      document.body.style.overflow = 'hidden';
      document.body.style.overflowX = 'hidden';
      document.documentElement.style.overflowX = 'hidden';
      document.body.style.width = '100%';
      document.body.style.maxWidth = '100%';
      
      return () => {
        // Restore original overflow styles
        document.body.style.overflow = bodyOriginalOverflow;
        document.body.style.overflowX = bodyOriginalOverflowX;
        document.documentElement.style.overflowX = htmlOriginalOverflowX;
        document.body.style.width = '';
        document.body.style.maxWidth = '';
      };
    }
  }, [open, isMobile]);

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

  // Use React portal for mobile to ensure it's at the root level
  const modalContent = (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-preview-title"
      className={`fixed inset-0 bg-black/80 flex items-center justify-center ${isMobile ? 'z-[9999]' : 'z-50'} p-2`}
      onClick={() => onOpenChange(false)}
      onTouchStart={(e) => {
        // Prevent scrolling when touching the backdrop
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
      style={isMobile ? {
        paddingTop: 'calc(0.5rem + env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'calc(0.5rem + env(safe-area-inset-left, 0px))',
        paddingRight: 'calc(0.5rem + env(safe-area-inset-right, 0px))',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        overflowY: 'hidden',
        touchAction: 'pan-y pinch-zoom', // Allow vertical scroll and zoom, but prevent horizontal
      } : {}}
    >
      <div 
        className={`bg-background rounded-lg max-w-4xl max-h-[90vh] w-full flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
        style={isMobile ? {
          maxHeight: 'calc(90vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
          // Use 100% instead of 100vw to avoid scrollbar width issues
          maxWidth: 'calc(100% - 1rem - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px))',
          width: 'calc(100% - 1rem - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px))',
          overflowX: 'hidden',
          overflowY: 'auto',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          minWidth: 0, // Important for flex items to shrink below content size
        } : {}}
      >
        <div className={`flex items-center justify-between p-4 border-b flex-shrink-0`}>
          <h3 id="file-preview-title" className={`text-lg font-semibold break-words flex-1 pr-2`} style={{ color: '#1A2D4D' }}>
            {fileName || 'Preview'}
          </h3>
          <Button 
            variant="ghost" 
            size="sm"
            className="hover:bg-muted"
            style={{ color: '#1A2D4D' }}
            onClick={() => {
              setPdfError(false);
              onOpenChange(false);
            }}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div 
          className={`p-4 flex-1 overflow-y-auto`} 
          style={isMobile ? { 
            overflowX: 'hidden',
            overflowY: 'auto',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            minWidth: 0, // Important for flex items
            width: '100%',
            maxWidth: '100%',
          } : {}}
        >
          {previewType === 'images' ? (
            <div style={isMobile ? { width: '100%', overflow: 'hidden' } : {}}>
              <img 
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-[70vh] object-contain mx-auto"
                style={isMobile ? { 
                  width: '100%', 
                  height: 'auto',
                  maxWidth: '100%',
                  objectFit: 'contain'
                } : {}}
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
            <div style={isMobile ? { width: '100%', overflow: 'hidden' } : {}}>
              <video 
                src={previewUrl}
                controls
                className="max-w-full max-h-[70vh] mx-auto"
                style={isMobile ? { 
                  width: '100%', 
                  height: 'auto',
                  maxWidth: '100%'
                } : {}}
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
            </div>
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
              <div className="mb-4">
                {pdfError ? (
                  <div className="text-center py-8">
                    <p className="text-sm mb-4" style={{ color: '#1A2D4D' }}>
                      PDF preview failed to load in iframe
                    </p>
                    <p className="text-xs mb-4" style={{ color: '#1A2D4D' }}>
                      This may be due to browser security settings. Please use the button below to open in a new tab.
                    </p>
                  </div>
                ) : (
                  <iframe
                    src={previewUrl}
                    className="w-full h-[60vh] border rounded"
                    title="PDF Preview"
                    style={isMobile ? { 
                      maxWidth: '100%',
                      width: '100%',
                      overflow: 'hidden'
                    } : {}}
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
                    className="w-full"
                    size="default"
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
                  className="w-full"
                  size="default"
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
              <div className="mb-4">
                <div className="text-center py-8">
                  <p className="text-sm mb-2 break-words" style={{ color: '#1A2D4D' }}>
                    Document preview not available
                  </p>
                  <p className="text-xs mb-2 break-words" style={{ color: '#1A2D4D' }}>
                    This file type cannot be previewed inline. Please download or open in a new tab.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  size="default"
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
                    className="w-full"
                    size="default"
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
            <div className="text-center py-8">
              <p className="text-sm mb-2 break-words" style={{ color: '#1A2D4D' }}>
                Preview not available for this file type
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                size="default"
                style={{ color: '#1A2D4D' }}
                onClick={() => window.open(fileUrl, '_blank')}
              >
                Open in New Tab
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Use portal for mobile to ensure it renders at root level
  if (isMobile && typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
