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

  // Function to open PDF directly from URL (for native apps)
  const openPdfDirectly = async (fileUrl, fileName) => {
    if (!Capacitor.isNativePlatform()) {
      // Web: use modal
      setPreviewFile({ url: fileUrl, name: fileName });
      return;
    }

    try {
      // Get preview URL (same logic as FilePreviewModal)
      const previewUrl = fileUrl.startsWith('http://') || fileUrl.startsWith('https://')
        ? fileUrl
        : `/api/library/preview?path=${encodeURIComponent(fileUrl)}`;
      
      // Open directly in native PDF viewer
      await FileViewer.openDocumentFromUrl({
        url: previewUrl,
      });
    } catch (error) {
      console.error('Error opening PDF:', error);
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
              // Check if it's a PDF on native platform
              const fileExtension = linkUrl.split('.').pop()?.toLowerCase();
              if (fileExtension === 'pdf' && isMobile && Capacitor.isNativePlatform()) {
                // Open directly in native PDF viewer
                openPdfDirectly(linkUrl, linkText);
              } else {
                // For other files or web, use modal
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

