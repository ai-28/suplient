"use client"

import { useState, useEffect } from "react";
import { useTranslation } from "@/app/context/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Card, CardContent } from "@/app/components/ui/card";
import { Upload, X, File, Image, Video, Music, FileText, FileImage, BookOpen, Loader2, Folder, CheckCircle2 } from "lucide-react";
import { TreePickerDialog } from "@/app/components/TreePickerDialog";
import { toast } from "sonner";
import { Progress } from "@/app/components/ui/progress";
import { useUploadManager } from "@/app/context/UploadManagerContext";
import { cn } from "@/app/lib/utils";

const categoryIcons = {
  videos: Video,
  images: Image,
  articles: FileText,
  sounds: Music,
  templates: FileImage,
  programs: BookOpen
};

const acceptedFormats = {
  videos: ".mp4,.mov,.avi,.mkv,.webm",
  images: ".jpg,.jpeg,.png,.gif,.webp,.svg",
  articles: ".pdf,.doc,.docx,.txt",
  sounds: ".mp3,.wav,.m4a,.ogg,.aac",
  templates: ".docx,.xlsx,.pptx,.pdf",
  programs: ".zip,.pdf,.docx"
};

const fileFieldNames = {
  videos: 'video',
  images: 'image',
  articles: 'article',
  sounds: 'sound',
  templates: 'template',
  programs: 'program'
};

export function FileUploadDialog({ category, currentFolderId, onUploadComplete, children }) {
  const t = useTranslation();
  const { addUpload, updateUpload, removeUpload, cancelUpload } = useUploadManager();
  const [open, setOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Multiple files support
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileMetadata, setFileMetadata] = useState({}); // { fileId: { title, description, author } }
  
  // Upload tracking per file
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({}); // { fileId: progress }
  const [uploadStatus, setUploadStatus] = useState({}); // { fileId: 'uploading' | 'completed' | 'failed' }
  const [activeUploads, setActiveUploads] = useState({}); // { fileId: uploadId }
  const [retryCount, setRetryCount] = useState({}); // { fileId: retryCount }
  
  // Folder selection state
  const [selectedFolderId, setSelectedFolderId] = useState(currentFolderId || null);
  const [availableFolders, setAvailableFolders] = useState([]);
  const [folderTree, setFolderTree] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [showTreePicker, setShowTreePicker] = useState(false);

  const IconComponent = categoryIcons[category] || File;
  
  // Get category title for dialog
  const getCategoryTitle = () => {
    const categoryMap = {
      videos: t('library.videos', 'Videos'),
      images: t('library.images', 'Images'),
      articles: t('library.articles', 'Articles'),
      sounds: t('library.sounds', 'Sounds')
    };
    return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  // Map category to resourceType
  const getResourceType = () => {
    const mapping = {
      videos: 'video',
      images: 'image',
      articles: 'article',
      sounds: 'sound'
    };
    return mapping[category] || 'video';
  };

  // Fetch all folders for this category (for selection)
  useEffect(() => {
    const fetchFolders = async () => {
      if (!category || !open) return;
      
      try {
        setLoadingFolders(true);
        const resourceType = getResourceType();
        // Fetch all folders (tree structure) for this category
        const response = await fetch(`/api/library/folders?resourceType=${resourceType}&tree=true`);
        const result = await response.json();
        
        if (result.status) {
          setFolderTree(result.folders || []);
          // Also keep flattened for backward compatibility if needed
          const flattenFolders = (folders, parentPath = '') => {
            let flat = [];
            folders.forEach(folder => {
              const path = parentPath ? `${parentPath} / ${folder.name}` : folder.name;
              flat.push({ ...folder, displayPath: path });
              if (folder.children && folder.children.length > 0) {
                flat = [...flat, ...flattenFolders(folder.children, path)];
              }
            });
            return flat;
          };
          
          setAvailableFolders(flattenFolders(result.folders || []));
        }
      } catch (error) {
        console.error('Error fetching folders:', error);
        setAvailableFolders([]);
      } finally {
        setLoadingFolders(false);
      }
    };

    fetchFolders();
  }, [category, open]);

  // Update selectedFolderId when currentFolderId changes
  useEffect(() => {
    setSelectedFolderId(currentFolderId || null);
  }, [currentFolderId]);

  // Generate unique ID for each file
  const getFileId = (file) => {
    return `${file.name}-${file.size}-${file.lastModified}`;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      addFiles(filesArray);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      addFiles(filesArray);
      // Reset input to allow selecting same files again
      e.target.value = '';
    }
  };

  const addFiles = (filesArray) => {
    const newFiles = [];
    const newMetadata = { ...fileMetadata };
    
    filesArray.forEach(file => {
      const fileId = getFileId(file);
      
      // Check if file already exists
      if (selectedFiles.find(f => getFileId(f) === fileId)) {
        return; // Skip duplicate
      }
      
      newFiles.push(file);
      
      // Auto-generate metadata from filename
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      newMetadata[fileId] = {
        title: fileNameWithoutExt,
        description: `Uploaded file: ${file.name}`,
        author: category === 'articles' ? '' : ''
      };
    });
    
    if (newFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newFiles]);
      setFileMetadata(newMetadata);
      toast.success(`${newFiles.length} file(s) added`);
    }
  };

  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(f => getFileId(f) !== fileId));
    setFileMetadata(prev => {
      const newMeta = { ...prev };
      delete newMeta[fileId];
      return newMeta;
    });
    
    // Cancel upload if in progress
    if (activeUploads[fileId]) {
      cancelUpload(activeUploads[fileId]);
      removeUpload(activeUploads[fileId]);
      setActiveUploads(prev => {
        const newActive = { ...prev };
        delete newActive[fileId];
        return newActive;
      });
    }
    
    // Clean up progress and status
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
    setUploadStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[fileId];
      return newStatus;
    });
  };

  const updateFileMetadata = (fileId, field, value) => {
    setFileMetadata(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        [field]: value
      }
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Upload using presigned URL with progress tracking and retry logic
  const uploadWithPresignedUrl = async (presignedUrl, file, onProgress, abortSignal) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Handle abort
      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          xhr.abort();
          reject(new Error('Upload cancelled'));
        });
      }

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // Handle timeout
      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'));
      });

      // Set timeout (30 minutes for large files)
      xhr.timeout = 30 * 60 * 1000;

      // Start upload
      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  };

  // Upload a single chunk directly to DigitalOcean Spaces using presigned URL
  // Direct upload bypasses Next.js body size limits (industry standard approach)
  // If presignedUrl is provided, uses it; otherwise fetches it (backward compatibility)
  const uploadChunk = async (chunk, partNumber, filePath, uploadId, onChunkProgress, abortSignal, presignedUrl = null) => {
    return new Promise(async (resolve, reject) => {
      // Get presigned URL from server if not provided
      let urlToUse = presignedUrl;
      if (!urlToUse) {
        try {
          const partUrlResponse = await fetch('/api/library/upload/part-url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filePath,
              uploadId,
              partNumber,
            }),
            signal: abortSignal,
          });

          if (!partUrlResponse.ok) {
            throw new Error(`Failed to get presigned URL for part ${partNumber}`);
          }

          const partUrlResult = await partUrlResponse.json();
          if (!partUrlResult.success) {
            throw new Error(partUrlResult.error || `Failed to get presigned URL for part ${partNumber}`);
          }

          urlToUse = partUrlResult.presignedUrl;
        } catch (error) {
          reject(new Error(`Failed to get presigned URL: ${error.message}`));
          return;
        }
      }

      const xhr = new XMLHttpRequest();

      // Handle abort
      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          xhr.abort();
          reject(new Error('Upload cancelled'));
        });
      }

      // Track chunk upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onChunkProgress) {
          const chunkProgress = (e.loaded / e.total) * 100;
          onChunkProgress(partNumber, chunkProgress);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Try to read ETag from response headers
          // Note: This may fail due to CORS, but we'll handle that server-side
          let etag = xhr.getResponseHeader('ETag') || xhr.getResponseHeader('etag');
          
          if (etag) {
            // Successfully got ETag from browser
            resolve({ partNumber, etag: etag.replace(/"/g, '') });
          } else {
            // ETag not accessible due to CORS - server will handle this
            // Return partNumber, server will list parts to get ETag
            resolve({ partNumber, etag: null });
          }
        } else {
          reject(new Error(`Chunk ${partNumber} upload failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error(`Network error during chunk ${partNumber} upload`));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // Handle timeout
      xhr.addEventListener('timeout', () => {
        reject(new Error(`Chunk ${partNumber} upload timeout`));
      });

      // Set timeout (10 minutes per chunk)
      xhr.timeout = 10 * 60 * 1000;

      console.log(`[Client] Uploading part ${partNumber} directly to DigitalOcean Spaces (chunk size: ${chunk.size} bytes)`);

      // Upload directly to DigitalOcean Spaces (bypasses Next.js body size limit)
      xhr.open('PUT', urlToUse);
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      xhr.send(chunk);
    });
  };

  // Pre-fetch presigned URLs in batches to avoid overwhelming the server
  const preFetchPresignedUrls = async (filePath, uploadId, totalChunks, abortSignal, batchSize = 10) => {
    const urlMap = new Map();
    const chunks = Array.from({ length: totalChunks }, (_, i) => i + 1);
    
    // Fetch URLs in batches to avoid overwhelming server
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const batchPromises = batch.map(async (partNumber) => {
        try {
          const response = await fetch('/api/library/upload/part-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath, uploadId, partNumber }),
            signal: abortSignal,
          });
          
          if (!response.ok) {
            throw new Error(`Failed to get presigned URL for part ${partNumber}`);
          }
          
          const result = await response.json();
          if (!result.success) {
            throw new Error(result.error || `Failed to get presigned URL for part ${partNumber}`);
          }
          
          return { partNumber, url: result.presignedUrl };
        } catch (error) {
          // If aborted, throw immediately
          if (error.name === 'AbortError' || abortSignal?.aborted) {
            throw error;
          }
          throw new Error(`Failed to fetch URL for part ${partNumber}: ${error.message}`);
        }
      });
      
      const results = await Promise.all(batchPromises);
      results.forEach(({ partNumber, url }) => {
        urlMap.set(partNumber, url);
      });
    }
    
    return urlMap;
  };

  // Upload chunks in parallel with progress tracking
  const uploadChunksInParallel = async (
    file,
    filePath,
    uploadId,
    chunkSize,
    totalChunks,
    onProgress,
    abortSignal,
    maxParallel = 6 // Default to 6 concurrent uploads per coach (good balance of speed & stability)
  ) => {
    const uploadedParts = [];
    const chunkProgress = new Map(); // Track progress of each chunk

    // Function to update overall progress
    const updateOverallProgress = () => {
      let totalProgress = 0;
      chunkProgress.forEach((progress) => {
        totalProgress += progress;
      });
      const overallProgress = (totalProgress / totalChunks);
      onProgress(overallProgress);
    };

    // Pre-fetch all presigned URLs upfront (optimization: reduces latency)
    console.log(`🔗 [OPTIMIZED] Pre-fetching ${totalChunks} presigned URLs (maxParallel: ${maxParallel})...`);
    let presignedUrlMap;
    try {
      presignedUrlMap = await preFetchPresignedUrls(filePath, uploadId, totalChunks, abortSignal);
      console.log(`✅ [OPTIMIZED] All ${totalChunks} presigned URLs fetched successfully, starting ${maxParallel} parallel uploads`);
    } catch (error) {
      // If pre-fetch fails, fall back to fetching URLs on-demand
      console.warn(`⚠️ Pre-fetch failed, falling back to on-demand URL fetching: ${error.message}`);
      presignedUrlMap = null;
    }

    // Function to upload a single chunk with retry
    const uploadChunkWithRetry = async (chunkIndex) => {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      const partNumber = chunkIndex + 1;
      
      // Use pre-fetched URL if available, otherwise uploadChunk will fetch it
      const presignedUrl = presignedUrlMap?.get(partNumber) || null;

      return await retryWithBackoff(async () => {
        return await uploadChunk(
          chunk,
          partNumber,
          filePath,
          uploadId,
          (partNum, progress) => {
            chunkProgress.set(partNum, progress);
            updateOverallProgress();
          },
          abortSignal,
          presignedUrl // Pass pre-fetched URL if available
        );
      });
    };

    // Progressive concurrency: keep up to maxParallel uploads running until all chunks are done
    // This is more efficient than strict batching but still caps per-coach load
    const chunks = Array.from({ length: totalChunks }, (_, i) => i);
    const results = [];
    let nextIndex = 0;

    const workerCount = Math.min(maxParallel, chunks.length);

    const runWorker = async (workerId) => {
      while (true) {
        if (abortSignal?.aborted) {
          throw new Error('Upload cancelled');
        }

        const currentIndex = nextIndex++;
        if (currentIndex >= chunks.length) {
          // No more chunks to process
          return;
        }

        const partNumber = currentIndex + 1;
        console.log(`📤 [WORKER ${workerId}] Uploading part ${partNumber}`);

        const result = await uploadChunkWithRetry(currentIndex);
        results.push(result);
      }
    };

    // Start workers (each maintains up to one active upload, total capped by workerCount)
    const workers = [];
    for (let i = 0; i < workerCount; i++) {
      workers.push(runWorker(i + 1));
    }

    // Wait for all workers to finish
    await Promise.all(workers);

    // All chunks uploaded successfully
    uploadedParts.push(...results);

    // Sort by part number
    uploadedParts.sort((a, b) => a.partNumber - b.partNumber);
    
    return uploadedParts;
  };

  // Retry logic with exponential backoff
  const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000, fileId = null) => {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on abort or cancellation
        if (error.message.includes('cancelled') || error.message.includes('abort')) {
          throw error;
        }
        
        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          break;
        }
        
        // Calculate delay with exponential backoff (1s, 2s, 4s)
        const delay = baseDelay * Math.pow(2, attempt);
        if (fileId) {
          setRetryCount(prev => ({ ...prev, [fileId]: attempt + 1 }));
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    if (fileId) {
      setRetryCount(prev => {
        const newRetry = { ...prev };
        delete newRetry[fileId];
        return newRetry;
      });
    }
    throw lastError;
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    // Validate all files have required metadata
    const missingMetadata = [];
    selectedFiles.forEach(file => {
      const fileId = getFileId(file);
      const meta = fileMetadata[fileId];
      if (!meta || !meta.title?.trim() || !meta.description?.trim()) {
        missingMetadata.push(file.name);
    }
    });
    
    if (missingMetadata.length > 0) {
      toast.error(`Missing metadata for: ${missingMetadata.join(', ')}`);
      return;
    }

    setUploading(true);
    setUploadProgress({});
    setUploadStatus({});
    setActiveUploads({});
    setRetryCount({});

    // Close dialog immediately - uploads continue in background
    // This prevents blocking the screen with many files
    setOpen(false);
    
    // Calculate optimal maxParallel per file based on total files
    // Best practice: Limit total concurrent connections to avoid browser queuing
    // Browser typically allows 6-10 concurrent connections per domain
    const totalFiles = selectedFiles.length;
    const MAX_TOTAL_CONCURRENT = 12; // Global limit across all files (safe for most browsers)
    const maxParallelPerFile = Math.max(2, Math.floor(MAX_TOTAL_CONCURRENT / totalFiles));
    
    // Log the concurrency strategy for debugging
    console.log(`📊 [MULTI-FILE] Uploading ${totalFiles} file(s) with ${maxParallelPerFile} chunks per file (${totalFiles * maxParallelPerFile} total concurrent)`);

    // Upload all files in parallel
    const uploadPromises = selectedFiles.map(async (file) => {
      const fileId = getFileId(file);
      const meta = fileMetadata[fileId];
      
      setUploadStatus(prev => ({ ...prev, [fileId]: 'uploading' }));
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

    const abortController = new AbortController();
      
      // Register upload with upload manager
      const uploadId = addUpload({
        fileName: file.name,
        fileSize: file.size,
        category: category,
        title: meta.title.trim(),
        abortController: abortController,
        status: 'uploading',
        progress: 0,
        startTime: Date.now() // Track start time for time estimation
      });
      
      setActiveUploads(prev => ({ ...prev, [fileId]: uploadId }));
    
    try {
        const fileSize = file.size;

        // Step 1: Get presigned URL
      let initiateResult;
      await retryWithBackoff(async () => {
        const initiateResponse = await fetch('/api/library/upload/initiate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              fileName: file.name,
            fileSize: fileSize,
              fileType: file.type,
            category: category,
          }),
          signal: abortController.signal,
        });

        if (!initiateResponse.ok) {
          throw new Error(`Failed to initiate upload: ${initiateResponse.statusText}`);
        }

        initiateResult = await initiateResponse.json();

        if (!initiateResult.success) {
          throw new Error(initiateResult.error || 'Failed to initiate upload');
        }
        }, 3, 1000, fileId);

        // Step 2: Upload file
      let uploadedParts = [];
      
      if (initiateResult.uploadType === 'multipart') {
        uploadedParts = await uploadChunksInParallel(
            file,
          initiateResult.filePath,
          initiateResult.uploadId,
          initiateResult.chunkSize,
          initiateResult.totalChunks,
            (progress) => {
              setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
              updateUpload(uploadId, { progress });
            },
          abortController.signal,
            maxParallelPerFile // Use dynamic concurrency based on file count
        );
      } else {
        await retryWithBackoff(async () => {
          await uploadWithPresignedUrl(
            initiateResult.presignedUrl,
              file,
              (progress) => {
                setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
                updateUpload(uploadId, { progress });
              },
            abortController.signal
          );
          }, 3, 1000, fileId);
      }

        // Step 3: Complete upload
      let completeResult;
      await retryWithBackoff(async () => {
        if (initiateResult.uploadType === 'multipart') {
          const completeResponse = await fetch('/api/library/upload/complete-multipart', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filePath: initiateResult.filePath,
              fileName: initiateResult.fileName,
              uploadId: initiateResult.uploadId,
              parts: uploadedParts,
                title: meta.title.trim(),
                description: meta.description.trim(),
                author: category === 'articles' ? (meta.author || '').trim() : '',
              category: category,
              fileSize: fileSize,
                fileType: file.type,
              folderId: selectedFolderId || null,
            }),
            signal: abortController.signal,
          });

          if (!completeResponse.ok) {
            throw new Error(`Failed to complete multipart upload: ${completeResponse.statusText}`);
          }

          completeResult = await completeResponse.json();

          if (!completeResult.success) {
            throw new Error(completeResult.error || 'Failed to complete multipart upload');
          }
        } else {
          const completeResponse = await fetch('/api/library/upload/complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filePath: initiateResult.filePath,
              fileName: initiateResult.fileName,
                title: meta.title.trim(),
                description: meta.description.trim(),
                author: category === 'articles' ? (meta.author || '').trim() : '',
              category: category,
              fileSize: fileSize,
                fileType: file.type,
              folderId: selectedFolderId || null,
            }),
            signal: abortController.signal,
          });

          if (!completeResponse.ok) {
            throw new Error(`Failed to complete upload: ${completeResponse.statusText}`);
          }

          completeResult = await completeResponse.json();

          if (!completeResult.success) {
            throw new Error(completeResult.error || 'Failed to complete upload');
          }
        }
        }, 3, 1000, fileId);

      // Success!
        updateUpload(uploadId, { status: 'completed', progress: 100 });
        setUploadStatus(prev => ({ ...prev, [fileId]: 'completed' }));
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
      
      onUploadComplete?.(completeResult.data);
      
        // Auto-remove from status bar after 5 seconds
        setTimeout(() => {
          removeUpload(uploadId);
        }, 5000);

        return { fileId, success: true, data: completeResult.data };
    } catch (error) {
        console.error(`Upload error for ${file.name}:`, error);
      
        if (activeUploads[fileId]) {
      if (error.message.includes('cancelled') || error.message.includes('abort')) {
            updateUpload(activeUploads[fileId], { status: 'cancelled' });
            setUploadStatus(prev => ({ ...prev, [fileId]: 'cancelled' }));
      } else {
            updateUpload(activeUploads[fileId], { status: 'failed', error: error.message });
            setUploadStatus(prev => ({ ...prev, [fileId]: 'failed' }));
          }
        }
        
        return { fileId, success: false, error: error.message };
      }
    });

    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    if (successful > 0) {
      toast.success(`Successfully uploaded ${successful} file(s)`);
    }
    
    if (failed > 0) {
      toast.error(`${failed} file(s) failed to upload`);
    }

    // Reset form if all successful (dialog already closed, just reset state)
    if (failed === 0) {
      setSelectedFiles([]);
      setFileMetadata({});
      setUploadProgress({});
      setUploadStatus({});
      setActiveUploads({});
      setRetryCount({});
    }
    
    setUploading(false);
  };

  const handleDialogClose = (newOpen) => {
    // Always allow closing - upload continues in background
    if (!newOpen && uploading) {
      // Show notification that upload continues in background
      toast.info("Upload continues in background", {
        description: "You can monitor progress in the upload status bar at the bottom of the screen.",
        duration: 3000
      });
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          // Always allow closing - upload continues in background
        }}
        onEscapeKeyDown={(e) => {
          // Always allow closing with Escape - upload continues in background
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            {t('library.uploadTo', 'Upload to {category}').replace('{category}', getCategoryTitle())}
            {selectedFiles.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* File Upload Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragActive 
                ? "border-primary bg-primary/5" 
                : selectedFiles.length === 0
                  ? "border-red-300 bg-red-50/50" 
                  : "border-muted-foreground/25"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFiles.length > 0 ? (
              <div className="space-y-4">
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {selectedFiles.map((file) => {
                    const fileId = getFileId(file);
                    const meta = fileMetadata[fileId] || {};
                    const progress = uploadProgress[fileId] || 0;
                    const status = uploadStatus[fileId];
                    const isUploading = status === 'uploading';
                    const isCompleted = status === 'completed';
                    const isFailed = status === 'failed';
                    const fileRetryCount = retryCount[fileId] || 0;
                    
                    return (
                      <div key={fileId} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <File className="h-5 w-5 text-primary flex-shrink-0" />
                            <span className="font-medium truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {formatFileSize(file.size)}
                            </span>
                            {isCompleted && (
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            )}
                            {isFailed && (
                              <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                            )}
                          </div>
                          {!isUploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                              onClick={() => removeFile(fileId)}
                              className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                          )}
                </div>
                        
                        {isUploading && (
                    <div className="space-y-1">
                            <Progress value={progress} className="w-full" />
                            <p className="text-xs text-muted-foreground text-right">
                              {progress.toFixed(0)}%
                              {fileRetryCount > 0 && (
                            <span className="ml-2 text-amber-600">
                                  ({t('library.retrying', 'Retrying...')} {fileRetryCount}/3)
                            </span>
                          )}
                            </p>
                          </div>
                        )}
                        
                        {!isUploading && (
                          <div className="space-y-2">
                            <Input
                              placeholder="Title *"
                              value={meta.title || ''}
                              onChange={(e) => updateFileMetadata(fileId, 'title', e.target.value)}
                              className={!meta.title?.trim() ? "border-red-500" : ""}
                            />
                            <Textarea
                              placeholder="Description *"
                              value={meta.description || ''}
                              onChange={(e) => updateFileMetadata(fileId, 'description', e.target.value)}
                              rows={2}
                              className={!meta.description?.trim() ? "border-red-500" : ""}
                            />
                            {category === 'articles' && (
                              <Input
                                placeholder="Author (optional)"
                                value={meta.author || ''}
                                onChange={(e) => updateFileMetadata(fileId, 'author', e.target.value)}
                              />
                        )}
                    </div>
                  )}
                </div>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    const fileInput = document.getElementById('file-upload');
                    if (fileInput) {
                      fileInput.click();
                    }
                  }}
                  disabled={uploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Add More Files
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-lg font-medium">{t('library.dropFilesHere', 'Drop files here or click to browse')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('library.acceptedFormats', 'Accepted formats')}: {acceptedFormats[category]}
                  </p>
                  <p className="text-xs text-red-500 mt-2">⚠️ {t('library.pleaseSelectFile', 'Please select at least one file to upload')}</p>
                </div>
                <Input
                  type="file"
                  accept={acceptedFormats[category]}
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  multiple
                />
                <Button 
                  variant="outline" 
                  className="w-full cursor-pointer"
                  onClick={() => {
                    const fileInput = document.getElementById('file-upload');
                    if (fileInput) {
                      fileInput.click();
                    }
                  }}
                >
                  {t('library.selectFiles', 'Select Files')}
                </Button>
              </div>
            )}
          </div>

            {/* Folder Selection */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>{t('library.uploadToFolder', 'Upload to Folder')}</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-2 border rounded-lg bg-muted/50 flex items-center gap-2">
                  <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-sm text-muted-foreground truncate">
                    {selectedFolderId ? (
                      loadingFolders ? t('common.messages.loading', 'Loading...') : (
                        availableFolders.find(f => f.id === selectedFolderId)?.displayPath || t('library.selectedFolder', 'Selected folder')
                      )
                    ) : (
                      t('library.root', '(Root)')
                    )}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTreePicker(true)}
                  disabled={loadingFolders}
                >
                  {t('common.buttons.change', 'Change')}
                </Button>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                if (uploading) {
                  // Cancel all uploads
                  Object.values(activeUploads).forEach(uploadId => {
                    cancelUpload(uploadId);
                    removeUpload(uploadId);
                  });
                }
                setOpen(false);
              }}
            >
              {uploading ? t('common.buttons.cancel', 'Cancel') : t('common.buttons.close', 'Close')}
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={selectedFiles.length === 0 || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('library.uploading', 'Uploading...')}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {t('library.uploadFiles', 'Upload {count} File(s)').replace('{count}', selectedFiles.length.toString())}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Tree Picker Dialog */}
      <TreePickerDialog
        open={showTreePicker}
        onOpenChange={setShowTreePicker}
        folders={folderTree}
        selectedFolderId={selectedFolderId}
        onSelect={(folderId) => {
          setSelectedFolderId(folderId);
          setShowTreePicker(false);
        }}
        title={t('library.selectUploadFolder', 'Select Upload Folder')}
        allowRoot={true}
        categoryInfo={{
          color: category === 'videos' ? 'bg-primary' : 
                 category === 'images' ? 'bg-accent' : 
                 category === 'articles' ? 'bg-secondary' : 
                 'bg-blue-teal'
        }}
      />
    </Dialog>
  );
}