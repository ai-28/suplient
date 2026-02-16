"use client"

import { createContext, useContext, useState, useCallback } from 'react';

const UploadManagerContext = createContext(null);

export function UploadManagerProvider({ children }) {
  const [uploads, setUploads] = useState([]);

  const addUpload = useCallback((upload) => {
    const uploadId = upload.id || `upload-${Date.now()}-${Math.random()}`;
    const uploadWithId = { 
      ...upload, 
      id: uploadId, 
      status: upload.status || 'uploading', 
      progress: upload.progress || 0,
      startTime: upload.startTime || Date.now()
    };
    
    setUploads(prev => [...prev, uploadWithId]);
    return uploadId;
  }, []);

  const updateUpload = useCallback((uploadId, updates) => {
    setUploads(prev => prev.map(upload => 
      upload.id === uploadId ? { ...upload, ...updates } : upload
    ));
  }, []);

  const removeUpload = useCallback((uploadId) => {
    setUploads(prev => prev.filter(upload => upload.id !== uploadId));
  }, []);

  const cancelUpload = useCallback((uploadId) => {
    setUploads(prev => prev.map(upload => {
      if (upload.id === uploadId && upload.abortController) {
        upload.abortController.abort();
        return { ...upload, status: 'cancelled' };
      }
      return upload;
    }));
  }, []);

  const getActiveUploads = useCallback(() => {
    return uploads.filter(upload => upload.status === 'uploading');
  }, [uploads]);

  const value = {
    uploads,
    addUpload,
    updateUpload,
    removeUpload,
    cancelUpload,
    getActiveUploads
  };

  return (
    <UploadManagerContext.Provider value={value}>
      {children}
    </UploadManagerContext.Provider>
  );
}

export function useUploadManager() {
  const context = useContext(UploadManagerContext);
  if (!context) {
    throw new Error('useUploadManager must be used within UploadManagerProvider');
  }
  return context;
}
