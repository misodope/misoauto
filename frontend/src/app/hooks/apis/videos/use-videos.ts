import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationResult,
  UseQueryResult,
} from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '@frontend/app/lib/axios';

// ============================================================================
// Types
// ============================================================================

export type VideoStatus = 'PROCESSING' | 'READY' | 'FAILED';

export type PostStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'FAILED';

export type PlatformType = 'TIKTOK' | 'YOUTUBE' | 'INSTAGRAM' | 'FACEBOOK';

export interface Platform {
  id: number;
  name: string;
  slug: string;
  type: PlatformType;
}

export interface VideoPostSummary {
  id: number;
  platformId: number;
  socialAccountId: number;
  status: PostStatus;
  scheduledFor?: string;
  postedAt?: string;
  createdAt: string;
  platform: Platform;
}

export interface Video {
  id: number;
  title: string;
  description?: string;
  s3Key: string;
  s3Bucket: string;
  mimeType: string;
  fileSize?: number;
  duration?: number;
  status: VideoStatus;
  createdAt: string;
  updatedAt: string;
  posts?: VideoPostSummary[];
}

export interface InitializeUploadRequest {
  filename: string;
  contentType: string;
  title: string;
  description?: string;
  fileSize?: number;
  duration?: number;
}

export interface InitializeUploadResponse {
  video: {
    id: number;
    title: string;
    status: VideoStatus;
  };
  upload: {
    url: string;
    key: string;
    expiresAt: string;
  };
}

export interface ConfirmUploadRequest {
  videoId: number;
  fileSize?: number;
  duration?: number;
}

export interface DownloadUrlResponse {
  url: string;
  expiresIn: number;
}

export interface VideoError {
  message: string;
  statusCode?: number;
  error?: string;
}

// ============================================================================
// API Functions
// ============================================================================

const initializeUpload = async (
  data: InitializeUploadRequest,
): Promise<InitializeUploadResponse> => {
  const response = await api.post('/videos/upload/initialize', data);
  return response.data;
};

const confirmUpload = async ({
  videoId,
  ...data
}: ConfirmUploadRequest): Promise<Video> => {
  const response = await api.post(`/videos/${videoId}/upload/confirm`, data);
  return response.data;
};

const getUserVideos = async (): Promise<Video[]> => {
  const response = await api.get('/videos');
  return response.data;
};

const getVideo = async (id: number): Promise<Video> => {
  const response = await api.get(`/videos/${id}`);
  return response.data;
};

const getDownloadUrl = async (id: number): Promise<DownloadUrlResponse> => {
  const response = await api.get(`/videos/${id}/download-url`);
  return response.data;
};

const deleteVideo = async (id: number): Promise<void> => {
  await api.delete(`/videos/${id}`);
};

// ============================================================================
// Query Keys
// ============================================================================

export const videoKeys = {
  all: ['videos'] as const,
  lists: () => [...videoKeys.all, 'list'] as const,
  list: () => [...videoKeys.lists()] as const,
  details: () => [...videoKeys.all, 'detail'] as const,
  detail: (id: number) => [...videoKeys.details(), id] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Initialize a video upload - creates video record and returns presigned URL
 */
export const useInitializeUpload = (): UseMutationResult<
  InitializeUploadResponse,
  AxiosError<VideoError>,
  InitializeUploadRequest
> => {
  return useMutation({
    mutationFn: initializeUpload,
    onError: (error) => {
      console.error(
        'Failed to initialize upload:',
        error.response?.data?.message || error.message,
      );
    },
  });
};

/**
 * Confirm upload completion - marks video as READY
 */
export const useConfirmUpload = (): UseMutationResult<
  Video,
  AxiosError<VideoError>,
  ConfirmUploadRequest
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: confirmUpload,
    onSuccess: (video) => {
      // Update the video in cache
      queryClient.setQueryData(videoKeys.detail(video.id), video);
      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: videoKeys.lists() });
    },
    onError: (error) => {
      console.error(
        'Failed to confirm upload:',
        error.response?.data?.message || error.message,
      );
    },
  });
};

/**
 * Get all videos for the current user
 */
export const useVideos = (): UseQueryResult<
  Video[],
  AxiosError<VideoError>
> => {
  return useQuery({
    queryKey: videoKeys.list(),
    queryFn: getUserVideos,
  });
};

/**
 * Get a single video by ID
 */
export const useVideo = (
  id: number,
  enabled = true,
): UseQueryResult<Video, AxiosError<VideoError>> => {
  return useQuery({
    queryKey: videoKeys.detail(id),
    queryFn: () => getVideo(id),
    enabled,
  });
};

/**
 * Get a presigned download URL for a video
 */
export const useVideoDownloadUrl = (): UseMutationResult<
  DownloadUrlResponse,
  AxiosError<VideoError>,
  number
> => {
  return useMutation({
    mutationFn: getDownloadUrl,
    onError: (error) => {
      console.error(
        'Failed to get download URL:',
        error.response?.data?.message || error.message,
      );
    },
  });
};

/**
 * Delete a video
 */
export const useDeleteVideo = (): UseMutationResult<
  void,
  AxiosError<VideoError>,
  number
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteVideo,
    onSuccess: (_, videoId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: videoKeys.detail(videoId) });
      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: videoKeys.lists() });
    },
    onError: (error) => {
      console.error(
        'Failed to delete video:',
        error.response?.data?.message || error.message,
      );
    },
  });
};
