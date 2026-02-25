"use client"

import React, { useState, useEffect } from 'react';
import { FilePreviewModal } from './FilePreviewModal';
import { isNative } from '@/lib/capacitor';
import { FileViewer } from '@capacitor/file-viewer';
import { Capacitor } from '@capacitor/core';

// Component to render message text with clickable links
// Parses markdown-style links: [text](url) and renders only the text as clickable
export function MessageWithLinks({ messageText, className = "" }) {
  const [previewFile, setPreviewFile] = useState({ url: null, name: null });
  const [isMobile, setIsMobile] = useState(false);

  // Check if running on native mobile (iOS/Android Capacitor)
  useEffect(() => {
    setIsMobile(isNative());
  }, []);

  // Helper function to get MIME type from file extension
  const getMimeType = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const mimeTypes = {
      // Images
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      // Videos
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv',
      'webm': 'video/webm',
      // Audio
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'm4a': 'audio/mp4',
      'aac': 'audio/aac',
      // Documents
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'rtf': 'application/rtf',
    };
    return mimeTypes[extension] || 'application/octet-stream';
  };

  // Helper function to determine file type
  const getFileType = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return 'images';
    } else if (['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(extension)) {
      return 'videos';
    } else if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(extension)) {
      return 'sounds';
    } else if (extension === 'pdf') {
      return 'pdf';
    } else if (['doc', 'docx', 'txt', 'rtf'].includes(extension)) {
      return 'document';
    }
    return 'document';
  };

  // Function to open file directly from URL (for native apps)
  const openFileDirectly = async (fileUrl, fileName) => {
    if (!Capacitor.isNativePlatform()) {
      // Web: use modal
      setPreviewFile({ url: fileUrl, name: fileName });
      return;
    }

    // Check if FileViewer is available
    if (!FileViewer) {
      console.error('FileViewer plugin not available - plugin may not be installed');
      console.error('Please install: npm install @capacitor/file-viewer');
      // Fallback: open in modal
      setPreviewFile({ url: fileUrl, name: fileName });
      return;
    }
    
    // Check if FileViewer methods are available
    if (!FileViewer.openDocumentFromUrl) {
      console.error('FileViewer.openDocumentFromUrl is not available');
      console.error('Plugin may not be properly synced. Run: npx cap sync');
      // Fallback: open in modal
      setPreviewFile({ url: fileUrl, name: fileName });
      return;
    }

    try {
      const platform = Capacitor.getPlatform();
      
      // Get preview URL - ensure it's absolute for Android
      let previewUrl;
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        // Already a full URL (CDN URL from DigitalOcean Spaces)
        // Use it directly - FileViewer can handle remote URLs
        previewUrl = fileUrl;
        console.log('Using direct CDN URL:', previewUrl);
      } else {
        // For library paths, make preview API URL absolute (required for Android)
        if (platform === 'android') {
          // Android requires absolute URLs
          const baseUrl = 'https://app.suplient.com'; // From capacitor.config.json
          previewUrl = `${baseUrl}/api/library/preview?path=${encodeURIComponent(fileUrl)}`;
          console.log('Android: Using preview API URL:', previewUrl);
        } else {
          // iOS can handle relative URLs
          previewUrl = `/api/library/preview?path=${encodeURIComponent(fileUrl)}`;
        }
      }
      
      // Extract filename from URL if not provided
      const finalFileName = fileName || fileUrl.split('/').pop() || 'document';
      const fileType = getFileType(finalFileName);
      const mimeType = getMimeType(finalFileName);
      
      console.log('Opening file directly from URL:', previewUrl);
      console.log('Platform:', platform);
      console.log('File type:', fileType);
      console.log('File name:', finalFileName);
      console.log('MIME type:', mimeType);
      
      // Use appropriate method based on file type and platform
      if (fileType === 'videos' || fileType === 'sounds') {
        // For media files (video/audio), use previewMediaContentFromUrl on iOS
        // This uses native iOS media player
        if (platform === 'ios' && FileViewer.previewMediaContentFromUrl) {
          console.log('Using iOS native media preview');
          await FileViewer.previewMediaContentFromUrl({
            url: previewUrl,
            mimeType: mimeType
          });
        } else {
          // For Android or if previewMediaContentFromUrl not available, use openDocumentFromUrl
          // This will show app chooser on Android
          console.log('Using document opener for media file');
          await FileViewer.openDocumentFromUrl({
            url: previewUrl,
            filename: finalFileName
          });
        }
      } else {
        // For documents, images, PDFs - use openDocumentFromUrl
        // iOS: Uses native document viewer (Quick Look)
        // Android: Shows app chooser for compatible apps
        console.log('Using document opener');
        
        if (platform === 'android') {
          // Android-specific: openDocumentFromUrl should work with remote URLs
          // The plugin will download the file and open it with the appropriate app
          console.log('Android: Opening document from URL:', previewUrl);
          console.log('Android: Filename:', finalFileName);
          console.log('Android: MIME type:', mimeType);
          
          try {
            // For Android, openDocumentFromUrl should handle remote URLs directly
            // It will download the file temporarily and open it with the system's default app
            await FileViewer.openDocumentFromUrl({
              url: previewUrl,
              filename: finalFileName
            });
            console.log('Android: File opened successfully in native viewer');
          } catch (androidError) {
            console.error('Android: Error opening file with FileViewer:', androidError);
            // If FileViewer fails, try alternative approach
            throw androidError;
          }
        } else {
          // iOS: unchanged - uses Quick Look
          await FileViewer.openDocumentFromUrl({
            url: previewUrl,
            filename: finalFileName
          });
        }
      }
      
      console.log('File opened successfully in native viewer');
    } catch (error) {
      console.error('Error opening file:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      // For Android, don't fall back to browser - use modal instead
      if (platform === 'android') {
        console.log('Falling back to modal for Android');
        setPreviewFile({ url: fileUrl, name: fileName });
      } else {
        // For iOS, also use modal as fallback
        setPreviewFile({ url: fileUrl, name: fileName });
      }
      
      // Re-throw to let caller handle if needed
      throw error;
    }
  };

  if (!messageText) return null;
  
  // Convert to string if it's not already
  const text = String(messageText);
  
  // Check if URL is a file (library file) based on extension or URL pattern
  const isFileUrl = (url) => {
    if (!url) return false;
    
    // Check if URL contains library path indicators
    if (url.includes('/library/') || url.includes('library/')) {
      return true;
    }
    
    // Check file extension
    const fileName = url.split('/').pop() || '';
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    const fileExtensions = [
      'pdf', 'doc', 'docx', 'txt', 'rtf',
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
      'mp4', 'avi', 'mov', 'wmv', 'webm',
      'mp3', 'wav', 'ogg', 'm4a', 'aac'
    ];
    
    return fileExtensions.includes(fileExtension);
  };
  
  // Match markdown-style links: [text](url)
  // Updated regex to handle URLs with parentheses and special characters
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  let keyCounter = 0;
  
  // Reset regex lastIndex to avoid issues with global regex
  linkRegex.lastIndex = 0;
  
  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Capture URL and text in variables to avoid closure issues
    const linkUrl = match[2];
    const linkText = match[1];
    
    // Check if this is a file URL
    const isFile = isFileUrl(linkUrl);
    
    // Add clickable link - only show the text part, URL is hidden
    // For Android file links, use span instead of <a> to completely prevent browser opening
    const platform = Capacitor.isNativePlatform() ? Capacitor.getPlatform() : null;
    const isAndroidFile = isFile && platform === 'android';
    
    // Debug logging
    if (isFile && Capacitor.isNativePlatform()) {
      console.log('File link detected:', {
        linkUrl,
        platform,
        isAndroidFile,
        isFile,
        isNative: Capacitor.isNativePlatform()
      });
    }
    
    // Use span for Android file links to prevent any browser navigation
    if (isAndroidFile) {
      parts.push(
        <span
          key={`link-${keyCounter++}`}
          className={`underline font-medium cursor-pointer break-all touch-manipulation`}
          style={{ 
            color: '#001583',
            WebkitTapHighlightColor: 'rgba(0, 21, 131, 0.2)',
            touchAction: 'manipulation',
            minHeight: '44px',
            display: 'inline-block',
            padding: '4px 0'
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.opacity = '0.7';
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onClick={async (e) => {
            // Aggressively prevent any default behavior or propagation
            e.preventDefault();
            e.stopPropagation();
            
            // stopImmediatePropagation may not be available in all React event contexts
            if (typeof e.stopImmediatePropagation === 'function') {
              e.stopImmediatePropagation();
            }
            
            if (linkUrl) {
              console.log('=== Android File Link Click Handler ===');
              console.log('Android file link clicked:', linkUrl);
              console.log('Platform confirmed:', Capacitor.getPlatform());
              console.log('Is native platform:', Capacitor.isNativePlatform());
              console.log('FileViewer available:', !!FileViewer);
              
              // Immediately call openFileDirectly - don't let anything else happen
              try {
                await openFileDirectly(linkUrl, linkText);
                console.log('File opened successfully via FileViewer');
              } catch (error) {
                console.error('Failed to open file in native viewer:', error);
                console.error('Error details:', JSON.stringify(error, null, 2));
                // Fallback to modal if native viewer fails - never open browser
                console.log('Falling back to modal preview');
                setPreviewFile({ url: linkUrl, name: linkText });
              }
            }
            
            // Return false as additional prevention
            return false;
          }}
        >
          {linkText}
        </span>
      );
    } else {
      // Use <a> tag for web, iOS, and non-file links
      parts.push(
        <a
          key={`link-${keyCounter++}`}
          href={linkUrl}
          target={isFile ? undefined : "_blank"}
          rel={isFile ? undefined : "noopener noreferrer"}
          className={`underline font-medium cursor-pointer break-all ${isMobile ? 'touch-manipulation' : ''}`}
          style={{ 
            color: '#001583',
            ...(isMobile && {
              WebkitTapHighlightColor: 'rgba(0, 21, 131, 0.2)',
              touchAction: 'manipulation',
              minHeight: '44px',
              display: 'inline-block',
              padding: '4px 0'
            })
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.opacity = '0.8';
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.opacity = '1';
            }
          }}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.opacity = '0.7';
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.opacity = '1';
            }
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (linkUrl) {
              if (isFile) {
                // For native platform (iOS), open all file types directly in native viewer
                if (isMobile && Capacitor.isNativePlatform()) {
                  // Open directly in native file viewer
                  openFileDirectly(linkUrl, linkText).catch((error) => {
                    console.error('Failed to open file in native viewer:', error);
                    // Fallback to modal if native viewer fails
                    setPreviewFile({ url: linkUrl, name: linkText });
                  });
                } else {
                  // For web, use modal
                  setPreviewFile({ url: linkUrl, name: linkText });
                }
              } else {
                // Open in new tab for regular links
                window.open(linkUrl, '_blank', 'noopener,noreferrer');
              }
            }
          }}
        >
          {linkText}
        </a>
      );
    }
    
    lastIndex = linkRegex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  // If no links found, return plain text
  // Note: Parent element should have whitespace-pre-wrap class
  if (parts.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <>
      <span className={className}>{parts}</span>
      <FilePreviewModal
        open={!!previewFile.url}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewFile({ url: null, name: null });
          }
        }}
        fileUrl={previewFile.url}
        fileName={previewFile.name}
        isMobile={isMobile}
      />
    </>
  );
}

