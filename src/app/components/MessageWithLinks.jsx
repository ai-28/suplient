"use client"

import React, { useState } from 'react';
import { FilePreviewModal } from './FilePreviewModal';

// Component to render message text with clickable links
// Parses markdown-style links: [text](url) and renders only the text as clickable
export function MessageWithLinks({ messageText, className = "" }) {
  const [previewFile, setPreviewFile] = useState({ url: null, name: null });

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
        className="text-blue-500 dark:text-blue-400 underline hover:text-blue-600 dark:hover:text-blue-300 font-medium cursor-pointer break-all"
        onClick={(e) => {
          e.preventDefault();
          if (linkUrl) {
            if (isFile) {
              // Open in modal for file links
              setPreviewFile({ url: linkUrl, name: linkText });
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
      />
    </>
  );
}

