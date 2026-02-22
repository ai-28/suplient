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

  // Function to inject styles into iframe content to prevent overflow
  const injectIframeStyles = (iframe) => {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        // Check if styles already injected
        if (iframeDoc.getElementById('modal-overflow-prevention')) {
          return;
        }
        
        const style = iframeDoc.createElement('style');
        style.id = 'modal-overflow-prevention';
        style.textContent = `
          * {
            max-width: 100% !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            box-sizing: border-box !important;
          }
          body {
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: hidden !important;
            padding: 1rem !important;
            margin: 0 !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
          }
          p, div, span, h1, h2, h3, h4, h5, h6, pre, code {
            max-width: 100% !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            white-space: normal !important;
            overflow-x: hidden !important;
          }
          img, video, audio, iframe, object, embed {
            max-width: 100% !important;
            width: auto !important;
            height: auto !important;
            box-sizing: border-box !important;
          }
          table {
            max-width: 100% !important;
            table-layout: auto !important;
            word-wrap: break-word !important;
          }
          td, th {
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            max-width: 100% !important;
          }
        `;
        iframeDoc.head.appendChild(style);
      }
    } catch (err) {
      // Cross-origin iframe, can't inject styles
      console.log('Cannot inject styles into iframe (cross-origin)');
    }
  };

  // Prevent body scroll when modal is open on mobile
  useEffect(() => {
    if (open && isMobile) {
      // Save current overflow style
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore original overflow style
        document.body.style.overflow = originalStyle;
      };
    }
  }, [open, isMobile]);

  // Monitor and fix overflow issues for all iframes when modal opens
  useEffect(() => {
    if (open && isMobile) {
      const fixIframeOverflow = () => {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
          injectIframeStyles(iframe);
        });
      };

      // Fix immediately
      fixIframeOverflow();

      // Fix after a short delay (in case iframes load asynchronously)
      const timeout = setTimeout(fixIframeOverflow, 500);
      const timeout2 = setTimeout(fixIframeOverflow, 1000);

      return () => {
        clearTimeout(timeout);
        clearTimeout(timeout2);
      };
    }
  }, [open, isMobile, fileUrl]);

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
      className={`fixed inset-0 bg-black/80 flex items-center justify-center ${isMobile ? 'z-[9999]' : 'z-50'} ${isMobile ? 'p-0' : 'p-2'}`}
      onClick={() => onOpenChange(false)}
      onTouchStart={(e) => {
        // Prevent scrolling when touching the backdrop
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
      style={isMobile ? {
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        touchAction: 'none',
        overflow: 'hidden', // Prevent backdrop from scrolling
        width: '100vw',
        maxWidth: '100vw',
        boxSizing: 'border-box',
      } : {}}
    >
      <div 
        className={`bg-background rounded-lg max-h-[90vh] flex flex-col overflow-hidden ${isMobile ? '' : 'w-full max-w-4xl'}`}
        onClick={(e) => e.stopPropagation()}
        style={isMobile ? {
          maxHeight: 'calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
          width: '100%',
          maxWidth: '100%',
          margin: '0.5rem',
          marginLeft: 'calc(0.5rem + env(safe-area-inset-left, 0px))',
          marginRight: 'calc(0.5rem + env(safe-area-inset-right, 0px))',
          boxSizing: 'border-box',
          overflowX: 'hidden',
          overflowY: 'hidden',
        } : {
          width: '100%',
        }}
      >
        <div className={`flex items-center justify-between p-4 border-b flex-shrink-0`} style={isMobile ? { overflowX: 'hidden', minWidth: 0 } : {}}>
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
            minWidth: 0, // Important for flex items to shrink
            maxWidth: '100%',
            width: '100%',
            boxSizing: 'border-box',
          } : {
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Inject styles for all content to prevent overflow */}
          {isMobile && (
            <style>{`
              /* Constrain all iframes in modal */
              iframe {
                max-width: 100% !important;
                width: 100% !important;
                box-sizing: border-box !important;
                overflow-x: hidden !important;
              }
              
              /* Ensure content inside iframe wraps (if same-origin) */
              iframe[src*="/api/library/preview"],
              iframe[src*="http://"],
              iframe[src*="https://"] {
                max-width: 100% !important;
                width: 100% !important;
              }
              
              /* Force all direct children to respect width */
              .modal-content-wrapper > * {
                max-width: 100% !important;
                width: 100% !important;
                box-sizing: border-box !important;
                overflow-x: hidden !important;
              }
              
              /* Force all nested elements to respect width */
              .modal-content-wrapper * {
                max-width: 100% !important;
                word-wrap: break-word !important;
                overflow-wrap: break-word !important;
                box-sizing: border-box !important;
              }
              
              /* Prevent horizontal overflow on all elements */
              .modal-content-wrapper img,
              .modal-content-wrapper video,
              .modal-content-wrapper audio,
              .modal-content-wrapper iframe,
              .modal-content-wrapper object,
              .modal-content-wrapper embed {
                max-width: 100% !important;
                width: auto !important;
                height: auto !important;
                box-sizing: border-box !important;
              }
              
              /* Force text elements to wrap */
              .modal-content-wrapper p,
              .modal-content-wrapper div,
              .modal-content-wrapper span,
              .modal-content-wrapper h1,
              .modal-content-wrapper h2,
              .modal-content-wrapper h3,
              .modal-content-wrapper h4,
              .modal-content-wrapper h5,
              .modal-content-wrapper h6,
              .modal-content-wrapper pre,
              .modal-content-wrapper code {
                max-width: 100% !important;
                word-wrap: break-word !important;
                overflow-wrap: break-word !important;
                white-space: normal !important;
                overflow-x: hidden !important;
              }
              
              /* Prevent table overflow */
              .modal-content-wrapper table {
                max-width: 100% !important;
                table-layout: auto !important;
                word-wrap: break-word !important;
              }
              
              .modal-content-wrapper td,
              .modal-content-wrapper th {
                word-wrap: break-word !important;
                overflow-wrap: break-word !important;
                max-width: 100% !important;
              }
            `}</style>
          )}
          <div className="modal-content-wrapper" style={isMobile ? { 
            width: '100%', 
            maxWidth: '100%', 
            overflowX: 'hidden',
            boxSizing: 'border-box'
          } : { width: '100%', boxSizing: 'border-box' }}>
          {previewType === 'images' ? (
            <div style={isMobile ? { width: '100%', maxWidth: '100%', overflow: 'hidden' } : {}}>
              <img 
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-[70vh] object-contain mx-auto"
                style={isMobile ? {
                  width: '100%',
                  height: 'auto',
                  maxWidth: '100%',
                  display: 'block',
                  boxSizing: 'border-box',
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
            <div style={isMobile ? { width: '100%', maxWidth: '100%', overflow: 'hidden' } : {}}>
              <video 
                src={previewUrl}
                controls
                className="max-w-full max-h-[70vh] mx-auto"
                style={isMobile ? {
                  width: '100%',
                  height: 'auto',
                  maxWidth: '100%',
                  display: 'block',
                  boxSizing: 'border-box',
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
            <div style={isMobile ? { width: '100%', maxWidth: '100%', overflow: 'hidden' } : {}}>
              <audio 
                src={previewUrl}
                controls
                className="w-full"
                style={isMobile ? {
                  width: '100%',
                  maxWidth: '100%',
                  display: 'block',
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
            <div style={isMobile ? { width: '100%', maxWidth: '100%', overflow: 'hidden' } : {}}>
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
                      width: '100%',
                      maxWidth: '100%',
                      border: 'none',
                      display: 'block',
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                    } : {
                      boxSizing: 'border-box',
                    }}
                    onLoad={(e) => {
                      setPdfError(false);
                      injectIframeStyles(e.target);
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
            <div style={isMobile ? { width: '100%', maxWidth: '100%', overflow: 'hidden' } : {}}>
              <div className="mb-4" style={isMobile ? { width: '100%', maxWidth: '100%', overflow: 'hidden', position: 'relative' } : { position: 'relative' }}>
                <iframe
                  src={previewUrl}
                  className="w-full h-[60vh] border rounded"
                  title="Document Preview"
                  style={isMobile ? {
                    width: '100%',
                    maxWidth: '100%',
                    border: 'none',
                    display: 'block',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                  } : {
                    boxSizing: 'border-box',
                  }}
                  sandbox="allow-same-origin allow-scripts"
                  scrolling="auto"
                  onLoad={(e) => {
                    injectIframeStyles(e.target);
                  }}
                />
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
            <div className="text-center py-8" style={isMobile ? { width: '100%', maxWidth: '100%', overflow: 'hidden' } : {}}>
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
    </div>
  );

  // Use portal for mobile to ensure it renders at root level
  if (isMobile && typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
