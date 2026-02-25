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
      console.error('FileViewer plugin not available');
      // Fallback: open in modal
      setPreviewFile({ url: fileUrl, name: fileName });
      return;
    }

    try {
      const platform = Capacitor.getPlatform();
      
      // Get preview URL - ensure it's absolute for Android
      let previewUrl;
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        // Already a full URL (CDN URL)
        previewUrl = fileUrl;
      } else {
        // For library paths, make preview API URL absolute (required for Android)
        if (platform === 'android') {
          // Android requires absolute URLs
          const baseUrl = 'https://app.suplient.com'; // From capacitor.config.json
          previewUrl = `${baseUrl}/api/library/preview?path=${encodeURIComponent(fileUrl)}`;
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
          // Android-specific: ensure proper parameters
          await FileViewer.openDocumentFromUrl({
            url: previewUrl,
            filename: finalFileName
          });
        } else {
          // iOS: unchanged
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
      // Fallback: open in modal
      setPreviewFile({ url: fileUrl, name: fileName });
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
    // For Android file links, remove href to prevent browser opening
    const isAndroidFile = isFile && isMobile && Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
    
    parts.push(
      <a
        key={`link-${keyCounter++}`}
        href={isAndroidFile ? undefined : linkUrl}
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
              // For native platform, open all file types directly in native viewer
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

