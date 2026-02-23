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

  // Prevent body scroll when modal is open on mobile
  useEffect(() => {
    if (open && isMobile) {
      // Save current overflow style
      const originalStyle = window.getComputedStyle(document.body).overflow;
      const originalOverflowX = window.getComputedStyle(document.body).overflowX;
      const originalPosition = window.getComputedStyle(document.body).position;
      
      document.body.style.overflow = 'hidden';
      document.body.style.overflowX = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      
      // Inject global style to prevent overflow in Capacitor
      const styleId = 'capacitor-modal-overflow-fix';
      let styleElement = document.getElementById(styleId);
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = `
          /* Prevent overflow in Capacitor WebView */
          body {
            overflow-x: hidden !important;
            max-width: 100vw !important;
          }
          * {
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          iframe {
            max-width: 100% !important;
            width: 100% !important;
          }
        `;
        document.head.appendChild(styleElement);
      }
      
      return () => {
        // Restore original styles
        document.body.style.overflow = originalStyle;
        document.body.style.overflowX = originalOverflowX;
        document.body.style.position = originalPosition;
        document.body.style.width = '';
        
        // Remove injected style
        const style = document.getElementById(styleId);
        if (style) {
          style.remove();
        }
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
        touchAction: 'none',
        overflow: 'hidden', // Prevent backdrop from scrolling
      } : {}}
    >
      <div 
        className={`bg-background rounded-lg max-w-4xl max-h-[90vh] flex flex-col overflow-hidden ${isMobile ? '' : 'w-full'}`}
        onClick={(e) => e.stopPropagation()}
        style={isMobile ? {
          maxHeight: 'calc(90vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 1rem)',
          width: 'calc(100% - 1rem - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px))',
          maxWidth: 'min(896px, calc(100% - 1rem - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)))',
          boxSizing: 'border-box',
          overflowX: 'hidden',
          overflowY: 'hidden',
          // Critical for Capacitor: ensure container doesn't allow horizontal overflow
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        } : {
          width: '100%',
        }}
      >
        <div className={`flex items-center justify-between p-4 border-b flex-shrink-0`}>
          <h3 className={`text-lg font-semibold break-words flex-1 pr-2`} style={{ color: '#1A2D4D' }}>
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
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            minWidth: 0, // Important for flex items to shrink
            maxWidth: '100%',
            width: '100%',
            boxSizing: 'border-box',
            // Prevent any horizontal scrolling in Capacitor
            WebkitOverflowScrolling: 'touch',
            // Ensure content respects container bounds
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          } : {
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          {previewType === 'images' ? (
            <div style={isMobile ? {
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflowX: 'hidden',
            } : {}}>
              <img 
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-[70vh] object-contain mx-auto"
                style={isMobile ? {
                  width: '100%',
                  height: 'auto',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  display: 'block',
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
            <div style={isMobile ? {
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflowX: 'hidden',
            } : {}}>
              <video 
                src={previewUrl}
                controls
                className="max-w-full max-h-[70vh] mx-auto"
                style={isMobile ? {
                  width: '100%',
                  height: 'auto',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  display: 'block',
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
            <div style={isMobile ? {
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflowX: 'hidden',
            } : {}}>
              <audio 
                src={previewUrl}
                controls
                className="w-full"
                style={isMobile ? {
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                } : {}}
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
            </div>
          ) : previewType === 'pdf' ? (
            <div style={isMobile ? {
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            } : {}}>
              <div className="mb-4" style={isMobile ? {
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflowX: 'hidden',
                flex: '1 1 auto',
                minHeight: 0,
              } : {}}>
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
                      width: '100%',
                      maxWidth: '100%',
                      minWidth: 0,
                      border: 'none',
                      boxSizing: 'border-box',
                      // Critical for Capacitor: prevent iframe from overflowing
                      flexShrink: 1,
                      overflow: 'hidden',
                      // Ensure iframe respects parent container
                      position: 'relative',
                    } : {
                      boxSizing: 'border-box',
                    }}
                    onLoad={() => {
                      setPdfError(false);
                      // Try to inject viewport meta into iframe if accessible (same-origin)
                      if (isMobile) {
                        try {
                          const iframe = document.querySelector('iframe[title="PDF Preview"]');
                          if (iframe && iframe.contentDocument) {
                            const iframeDoc = iframe.contentDocument;
                            // Check if viewport meta exists
                            let viewportMeta = iframeDoc.querySelector('meta[name="viewport"]');
                            if (!viewportMeta) {
                              viewportMeta = iframeDoc.createElement('meta');
                              viewportMeta.setAttribute('name', 'viewport');
                              viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover');
                              iframeDoc.head.insertBefore(viewportMeta, iframeDoc.head.firstChild);
                            }
                            
                            // Inject responsive CSS for PDF content
                            const styleId = 'capacitor-pdf-responsive-styles';
                            if (!iframeDoc.getElementById(styleId)) {
                              const style = iframeDoc.createElement('style');
                              style.id = styleId;
                              style.textContent = `
                                * {
                                  box-sizing: border-box;
                                }
                                body {
                                  margin: 0;
                                  padding: 0.5rem;
                                  word-wrap: break-word;
                                  overflow-wrap: break-word;
                                  word-break: break-word;
                                  -webkit-text-size-adjust: 100%;
                                  max-width: 100%;
                                  overflow-x: hidden;
                                  width: 100%;
                                }
                                embed, object, iframe {
                                  max-width: 100% !important;
                                  width: 100% !important;
                                }
                              `;
                              iframeDoc.head.appendChild(style);
                            }
                          }
                        } catch (e) {
                          // Cross-origin or security restriction - this is expected for external PDFs
                          console.log('Cannot modify iframe content (cross-origin restriction)');
                        }
                      }
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
            <div style={isMobile ? {
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflowX: 'hidden',
            } : {}}>
              <div className="mb-4" style={isMobile ? {
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflowX: 'hidden',
              } : {}}>
                <div className="text-center py-8" style={isMobile ? {
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                } : {}}>
                  <p className="text-sm mb-2 break-words" style={{ color: '#1A2D4D', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    Document preview not available
                  </p>
                  <p className="text-xs mb-2 break-words" style={{ color: '#1A2D4D', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
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
            <div className="text-center py-8" style={isMobile ? {
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflowX: 'hidden',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
            } : {}}>
              <p className="text-sm mb-2 break-words" style={{ color: '#1A2D4D', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
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
