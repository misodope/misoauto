'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import axios from 'axios';
import api from '../../lib/axios';

export type UploadStatus =
  | 'initializing'
  | 'uploading'
  | 'confirming'
  | 'completed'
  | 'error';

export interface Upload {
  id: string;
  videoId?: number;
  filename: string;
  title: string;
  progress: number;
  status: UploadStatus;
  error?: string;
}

interface UploadInternal extends Upload {
  abortController: AbortController;
}

export interface StartVideoUploadOptions {
  file: File;
  title: string;
  description?: string;
  onProgress?: (progress: number) => void;
  onComplete?: (upload: Upload) => void;
  onError?: (error: Error) => void;
}

type UploadsContextType = {
  uploads: Map<string, Upload>;
  activeCount: number;
  hasActiveUploads: boolean;
  startVideoUpload: (options: StartVideoUploadOptions) => string;
  cancelUpload: (id: string) => void;
  clearUpload: (id: string) => void;
  clearCompleted: () => void;
  getUpload: (id: string) => Upload | undefined;
};

const UploadsContext = createContext<UploadsContextType | undefined>(undefined);

/**
 * Generate a unique upload ID
 */
const generateUploadId = (): string => {
  return `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [uploads, setUploads] = useState<Map<string, Upload>>(new Map());
  const uploadsRef = useRef<Map<string, UploadInternal>>(new Map());

  // Calculate active uploads count
  const activeCount = Array.from(uploads.values()).filter(
    (u) =>
      u.status === 'uploading' ||
      u.status === 'initializing' ||
      u.status === 'confirming',
  ).length;
  const hasActiveUploads = activeCount > 0;

  // Warn user before closing tab if uploads are in progress
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasActiveUploads) {
        e.preventDefault();
        e.returnValue =
          'You have uploads in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasActiveUploads]);

  /**
   * Update the public uploads state from internal state
   */
  const syncUploadsState = useCallback(() => {
    const publicUploads = new Map<string, Upload>();
    uploadsRef.current.forEach((internal, id) => {
      const { abortController, ...publicUpload } = internal;
      publicUploads.set(id, publicUpload);
    });
    setUploads(publicUploads);
  }, []);

  /**
   * Start a video upload with the full flow:
   * 1. Initialize upload (create video record + get presigned URL)
   * 2. Upload file to R2
   * 3. Confirm upload (mark video as READY)
   */
  const startVideoUpload = useCallback(
    ({
      file,
      title,
      description,
      onProgress,
      onComplete,
      onError,
    }: StartVideoUploadOptions): string => {
      const id = generateUploadId();
      const abortController = new AbortController();

      // Initialize upload state
      const uploadInternal: UploadInternal = {
        id,
        filename: file.name,
        title,
        progress: 0,
        status: 'initializing',
        abortController,
      };

      uploadsRef.current.set(id, uploadInternal);
      syncUploadsState();

      // Start the upload flow
      (async () => {
        try {
          // Step 1: Initialize upload with backend
          const initResponse = await api.post('/videos/upload/initialize', {
            filename: file.name,
            contentType: file.type,
            title,
            description,
            fileSize: file.size,
          });

          const { video, upload: uploadInfo } = initResponse.data;

          const currentUpload = uploadsRef.current.get(id);
          if (!currentUpload) return; // Was cancelled

          currentUpload.videoId = video.id;
          currentUpload.status = 'uploading';
          syncUploadsState();

          // Step 2: Upload file directly to R2
          await axios.put(uploadInfo.url, file, {
            headers: {
              'Content-Type': file.type,
            },
            signal: abortController.signal,
            onUploadProgress: (progressEvent) => {
              const progress = progressEvent.total
                ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                : 0;

              const upload = uploadsRef.current.get(id);
              if (upload) {
                upload.progress = progress;
                syncUploadsState();
                onProgress?.(progress);
              }
            },
          });

          const uploadAfterR2 = uploadsRef.current.get(id);
          if (!uploadAfterR2) return; // Was cancelled

          uploadAfterR2.status = 'confirming';
          syncUploadsState();

          // Step 3: Confirm upload with backend
          await api.post(`/videos/${video.id}/upload/confirm`, {
            fileSize: file.size,
          });

          const finalUpload = uploadsRef.current.get(id);
          if (finalUpload) {
            finalUpload.status = 'completed';
            finalUpload.progress = 100;
            syncUploadsState();
            onComplete?.({
              id: finalUpload.id,
              videoId: finalUpload.videoId,
              filename: finalUpload.filename,
              title: finalUpload.title,
              progress: finalUpload.progress,
              status: finalUpload.status,
            });
          }
        } catch (error) {
          // Don't treat cancellation as an error
          if (axios.isCancel(error)) {
            uploadsRef.current.delete(id);
            syncUploadsState();
            return;
          }

          const upload = uploadsRef.current.get(id);
          if (upload) {
            upload.status = 'error';
            upload.error =
              error instanceof Error ? error.message : 'Upload failed';
            syncUploadsState();
            onError?.(
              error instanceof Error ? error : new Error('Upload failed'),
            );
          }
        }
      })();

      return id;
    },
    [syncUploadsState],
  );

  /**
   * Cancel an active upload
   */
  const cancelUpload = useCallback(
    (id: string) => {
      const upload = uploadsRef.current.get(id);
      if (
        upload &&
        upload.status !== 'completed' &&
        upload.status !== 'error'
      ) {
        upload.abortController.abort();
        uploadsRef.current.delete(id);
        syncUploadsState();
      }
    },
    [syncUploadsState],
  );

  /**
   * Clear a single upload from state
   */
  const clearUpload = useCallback(
    (id: string) => {
      const upload = uploadsRef.current.get(id);
      if (upload) {
        if (upload.status !== 'completed' && upload.status !== 'error') {
          upload.abortController.abort();
        }
        uploadsRef.current.delete(id);
        syncUploadsState();
      }
    },
    [syncUploadsState],
  );

  /**
   * Clear all completed/errored uploads
   */
  const clearCompleted = useCallback(() => {
    uploadsRef.current.forEach((upload, id) => {
      if (upload.status === 'completed' || upload.status === 'error') {
        uploadsRef.current.delete(id);
      }
    });
    syncUploadsState();
  }, [syncUploadsState]);

  /**
   * Get a specific upload by ID
   */
  const getUpload = useCallback(
    (id: string): Upload | undefined => {
      return uploads.get(id);
    },
    [uploads],
  );

  return (
    <UploadsContext.Provider
      value={{
        uploads,
        activeCount,
        hasActiveUploads,
        startVideoUpload,
        cancelUpload,
        clearUpload,
        clearCompleted,
        getUpload,
      }}
    >
      {children}
    </UploadsContext.Provider>
  );
};

/**
 * Hook to access uploads state and functions
 */
export const useUploads = (): UploadsContextType => {
  const context = useContext(UploadsContext);
  if (!context) {
    throw new Error('useUploads must be used within an UploadProvider');
  }
  return context;
};
