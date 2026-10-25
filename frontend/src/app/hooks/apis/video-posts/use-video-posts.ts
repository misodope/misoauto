import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationResult,
  UseQueryResult,
} from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '@frontend/app/lib/axios';
import { Video, videoKeys } from '../videos/use-videos';

// ============================================================================
// Types
// ============================================================================

export type PostStatus =
  'PENDING' | 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED' | 'CANCELLED';

export type UploadMode = 'DRAFT' | 'DIRECT';

export interface Platform {
  id: number;
  name: string;
  slug: string;
}

export interface SocialAccount {
  id: number;
  platformId: number;
  platformUserId: string;
  username: string;
  displayName?: string;
  profileImageUrl?: string;
}

export interface VideoPost {
  id: number;
  videoId: number;
  platformId: number;
  socialAccountId: number;
  platformPostId?: string;
  postUrl?: string;
  status: PostStatus;
  scheduledFor?: string;
  postedAt?: string;
  uploadMode: UploadMode;
  title?: string | null;
  caption?: string | null;
  options?: Record<string, unknown> | null;
  batchId?: string | null;
  createdAt: string;
  updatedAt: string;
  video: Video;
  platform: Platform;
  socialAccount: SocialAccount;
}

export interface CreateVideoPostRequest {
  videoId: number;
  socialAccountId: number;
  scheduledFor?: string;
}

export interface VideoPostDetails {
  uploadMode?: UploadMode;
  title?: string;
  caption?: string;
  options?: Record<string, unknown>;
}

export interface VideoPostTarget extends VideoPostDetails {
  socialAccountId: number;
}

export interface CreateVideoPostBatchRequest {
  videoId: number;
  scheduledFor: string;
  targets: VideoPostTarget[];
}

export interface CreateVideoPostBatchResponse {
  batchId: string;
  posts: VideoPost[];
}

export type UpdateVideoPostDetailsRequest = { id: number } & VideoPostDetails;

export interface ScheduleVideoPostRequest {
  scheduledFor: string;
}

export interface VideoPostError {
  message: string;
  statusCode?: number;
  error?: string;
}

// ============================================================================
// API Functions
// ============================================================================

const createVideoPost = async (
  data: CreateVideoPostRequest,
): Promise<VideoPost> => {
  const response = await api.post('/video-posts', data);
  return response.data;
};

const createVideoPostBatch = async (
  data: CreateVideoPostBatchRequest,
): Promise<CreateVideoPostBatchResponse> => {
  const response = await api.post('/video-posts/batch', data);
  return response.data;
};

const updateVideoPostDetails = async ({
  id,
  ...details
}: UpdateVideoPostDetailsRequest): Promise<VideoPost> => {
  const response = await api.patch(`/video-posts/${id}`, details);
  return response.data;
};

const getVideoPosts = async (videoId?: number): Promise<VideoPost[]> => {
  const params = videoId ? { videoId: videoId.toString() } : undefined;
  const response = await api.get('/video-posts', { params });
  return response.data;
};

const getVideoPost = async (id: number): Promise<VideoPost> => {
  const response = await api.get(`/video-posts/${id}`);
  return response.data;
};

const scheduleVideoPost = async ({
  id,
  scheduledFor,
}: {
  id: number;
  scheduledFor: string;
}): Promise<VideoPost> => {
  const response = await api.patch(`/video-posts/${id}/schedule`, {
    scheduledFor,
  });
  return response.data;
};

const cancelSchedule = async (id: number): Promise<VideoPost> => {
  const response = await api.patch(`/video-posts/${id}/cancel-schedule`);
  return response.data;
};

const deleteVideoPost = async (id: number): Promise<void> => {
  await api.delete(`/video-posts/${id}`);
};

// ============================================================================
// Query Keys
// ============================================================================

export const videoPostKeys = {
  all: ['video-posts'] as const,
  lists: () => [...videoPostKeys.all, 'list'] as const,
  list: (videoId?: number) =>
    videoId
      ? ([...videoPostKeys.lists(), { videoId }] as const)
      : ([...videoPostKeys.lists()] as const),
  details: () => [...videoPostKeys.all, 'detail'] as const,
  detail: (id: number) => [...videoPostKeys.details(), id] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Create a new video post
 */
export const useCreateVideoPost = (): UseMutationResult<
  VideoPost,
  AxiosError<VideoPostError>,
  CreateVideoPostRequest
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVideoPost,
    onSuccess: (videoPost) => {
      // Add to cache
      queryClient.setQueryData(videoPostKeys.detail(videoPost.id), videoPost);
      // Invalidate video post lists to refetch
      queryClient.invalidateQueries({ queryKey: videoPostKeys.lists() });
      // Also invalidate the related video's posts
      queryClient.invalidateQueries({
        queryKey: videoPostKeys.list(videoPost.videoId),
      });
      // Invalidate videos list so the table shows updated posts
      queryClient.invalidateQueries({ queryKey: videoKeys.lists() });
    },
    onError: (error) => {
      console.error(
        'Failed to create video post:',
        error.response?.data?.message || error.message,
      );
    },
  });
};

/**
 * Schedule a video on several accounts in one all-or-nothing request
 */
export const useCreateVideoPostBatch = (): UseMutationResult<
  CreateVideoPostBatchResponse,
  AxiosError<VideoPostError>,
  CreateVideoPostBatchRequest
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVideoPostBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: videoPostKeys.lists() });
      queryClient.invalidateQueries({ queryKey: videoKeys.lists() });
    },
    onError: (error) => {
      console.error(
        'Failed to schedule video posts:',
        error.response?.data?.message || error.message,
      );
    },
  });
};

/**
 * Update the per-platform details (caption, title, options) of a post
 */
export const useUpdateVideoPostDetails = (): UseMutationResult<
  VideoPost,
  AxiosError<VideoPostError>,
  UpdateVideoPostDetailsRequest
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateVideoPostDetails,
    onSuccess: (videoPost) => {
      queryClient.setQueryData(videoPostKeys.detail(videoPost.id), videoPost);
      queryClient.invalidateQueries({ queryKey: videoPostKeys.lists() });
      queryClient.invalidateQueries({ queryKey: videoKeys.lists() });
    },
    onError: (error) => {
      console.error(
        'Failed to update video post details:',
        error.response?.data?.message || error.message,
      );
    },
  });
};

/**
 * Get all video posts, optionally filtered by videoId
 */
export const useVideoPosts = (
  videoId?: number,
): UseQueryResult<VideoPost[], AxiosError<VideoPostError>> => {
  return useQuery({
    queryKey: videoPostKeys.list(videoId),
    queryFn: () => getVideoPosts(videoId),
  });
};

/**
 * Get a single video post by ID
 */
export const useVideoPost = (
  id: number,
  enabled = true,
): UseQueryResult<VideoPost, AxiosError<VideoPostError>> => {
  return useQuery({
    queryKey: videoPostKeys.detail(id),
    queryFn: () => getVideoPost(id),
    enabled,
  });
};

/**
 * Schedule a video post
 */
export const useScheduleVideoPost = (): UseMutationResult<
  VideoPost,
  AxiosError<VideoPostError>,
  { id: number; scheduledFor: string }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scheduleVideoPost,
    onSuccess: (videoPost) => {
      // Update the post in cache
      queryClient.setQueryData(videoPostKeys.detail(videoPost.id), videoPost);
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: videoPostKeys.lists() });
      // Refresh the videos table, which renders each video's posts
      queryClient.invalidateQueries({ queryKey: videoKeys.lists() });
    },
    onError: (error) => {
      console.error(
        'Failed to schedule video post:',
        error.response?.data?.message || error.message,
      );
    },
  });
};

/**
 * Cancel a scheduled video post
 */
export const useCancelSchedule = (): UseMutationResult<
  VideoPost,
  AxiosError<VideoPostError>,
  number
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelSchedule,
    onSuccess: (videoPost) => {
      // Update the post in cache
      queryClient.setQueryData(videoPostKeys.detail(videoPost.id), videoPost);
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: videoPostKeys.lists() });
      // Refresh the videos table, which renders each video's posts
      queryClient.invalidateQueries({ queryKey: videoKeys.lists() });
    },
    onError: (error) => {
      console.error(
        'Failed to cancel schedule:',
        error.response?.data?.message || error.message,
      );
    },
  });
};

/**
 * Delete a video post
 */
export const useDeleteVideoPost = (): UseMutationResult<
  void,
  AxiosError<VideoPostError>,
  number
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteVideoPost,
    onSuccess: (_, videoPostId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: videoPostKeys.detail(videoPostId),
      });
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: videoPostKeys.lists() });
      // Refresh the videos table, which renders each video's posts
      queryClient.invalidateQueries({ queryKey: videoKeys.lists() });
    },
    onError: (error) => {
      console.error(
        'Failed to delete video post:',
        error.response?.data?.message || error.message,
      );
    },
  });
};
