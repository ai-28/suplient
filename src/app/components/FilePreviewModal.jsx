"use client"

import React from 'react';
import { Button } from '@/app/components/ui/button';

export function FilePreviewModal({ 
  open, 
  onOpenChange, 
  fileUrl, 
  fileName = '',
  isMobile = false 
}) {
  if (!open || !fileUrl) return null;

  // Determine file type based on file extension
  const getFileType = (url, name) => {
    const fileName = name || url.split('/').pop() || '';
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    
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

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2"
      onClick={() => onOpenChange(false)}
    >
      <div 
        className={`bg-background rounded-lg ${isMobile ? 'max-w-full' : 'max-w-4xl'} max-h-[90vh] w-full overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between ${isMobile ? 'p-2' : 'p-4'} border-b`}>
          <h3 className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold break-words`}>
            {fileName || 'Preview'}
          </h3>
          <Button 
            variant="ghost" 
            size={isMobile ? "sm" : "sm"}
            className={isMobile ? 'h-6 w-6 p-0' : ''}
            onClick={() => onOpenChange(false)}
          >
            ✕
          </Button>
        </div>
        <div className={isMobile ? 'p-2' : 'p-4'}>
          {previewType === 'images' ? (
            <div>
              <img 
                src={`/api/library/preview?path=${encodeURIComponent(fileUrl)}`}
                alt="Preview"
                className="max-w-full max-h-[70vh] object-contain mx-auto"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.className = 'text-center py-8';
                  fallback.innerHTML = `
                    <p class="text-muted-foreground mb-4">Preview failed to load</p>
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
              src={`/api/library/preview?path=${encodeURIComponent(fileUrl)}`}
              controls
              className="max-w-full max-h-[70vh] mx-auto"
              onError={(e) => {
                e.target.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'text-center py-8';
                fallback.innerHTML = `
                  <p class="text-muted-foreground mb-4">Video failed to load</p>
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
              src={`/api/library/preview?path=${encodeURIComponent(fileUrl)}`}
              controls
              className="w-full"
              onError={(e) => {
                e.target.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'text-center py-8';
                fallback.innerHTML = `
                  <p class="text-muted-foreground mb-4">Audio failed to load</p>
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
              <div className={isMobile ? 'mb-2' : 'mb-4'}>
                <iframe
                  src={`/api/library/preview?path=${encodeURIComponent(fileUrl)}`}
                  className={`w-full ${isMobile ? 'h-[50vh]' : 'h-[60vh]'} border rounded`}
                  title="PDF Preview"
                />
              </div>
              <div className="text-center">
                <Button 
                  variant="outline" 
                  className={`w-full ${isMobile ? 'text-xs h-8' : ''}`}
                  size={isMobile ? "sm" : "default"}
                  onClick={() => {
                    const apiUrl = `/api/library/preview?path=${encodeURIComponent(fileUrl)}`;
                    window.open(apiUrl, '_blank');
                  }}
                >
                  Open in New Tab
                </Button>
              </div>
            </div>
          ) : previewType === 'document' ? (
            <div>
              <div className={isMobile ? 'mb-2' : 'mb-4'}>
                <div className={`text-center ${isMobile ? 'py-4' : 'py-8'}`}>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mb-2 break-words`}>
                    Document preview not available
                  </p>
                  <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground mb-2 break-words`}>
                    This file type cannot be previewed inline
                  </p>
                </div>
              </div>
              <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
                <Button 
                  variant="outline" 
                  className={`w-full ${isMobile ? 'text-xs h-8' : ''}`}
                  size={isMobile ? "sm" : "default"}
                  onClick={() => {
                    const apiUrl = `/api/library/preview?path=${encodeURIComponent(fileUrl)}`;
                    window.open(apiUrl, '_blank');
                  }}
                >
                  Open in New Tab
                </Button>
                <Button 
                  variant="outline" 
                  className={`w-full ${isMobile ? 'text-xs h-8' : ''}`}
                  size={isMobile ? "sm" : "default"}
                  onClick={() => {
                    window.open(fileUrl, '_blank');
                  }}
                >
                  Open Original URL
                </Button>
              </div>
            </div>
          ) : (
            <div className={`text-center ${isMobile ? 'py-4' : 'py-8'}`}>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mb-2 break-words`}>
                Preview not available for this file type
              </p>
              <Button 
                variant="outline" 
                className={`mt-4 ${isMobile ? 'text-xs h-8' : ''}`}
                size={isMobile ? "sm" : "default"}
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
}
