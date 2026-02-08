import api from '@frontend/app/lib/axios';
import {
  useMutation,
  useQuery,
  UseMutationResult,
  UseQueryResult,
} from '@tanstack/react-query';
import { AxiosError } from 'axios';

// ============================================================================
// Types
// ============================================================================

export interface TikTokUserInfo {
  open_id: string;
  union_id: string;
  avatar_url: string;
  avatar_url_100: string;
  avatar_large_url: string;
  display_name: string;
  bio_description: string;
  profile_deep_link: string;
  is_verified: boolean;
  follower_count: number;
  following_count: number;
  likes_count: number;
  video_count: number;
}

export interface TikTokUserInfoResponse {
  user: TikTokUserInfo;
  platform: 'tiktok';
}

export interface TikTokVideo {
  id: string;
  create_time: number;
  cover_image_url: string;
  share_url: string;
  video_description: string;
  duration: number;
  height: number;
  width: number;
  title: string;
  embed_html: string;
  embed_link: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
}

export interface TikTokVideoListRequest {
  cursor?: number;
  maxCount?: number;
}

export interface TikTokVideoListResponse {
  videos: TikTokVideo[];
  cursor: number;
  has_more: boolean;
  platform: 'tiktok';
}

export interface TikTokVideoQueryRequest {
  videoIds: string[];
}

export interface TikTokVideoQueryResponse {
  videos: TikTokVideo[];
  platform: 'tiktok';
}

export interface TikTokUploadDraftRequest {
  videoId: number;
}

export interface TikTokUploadDraftResponse {
  publish_id: string;
  upload_url?: string;
  platform: 'tiktok';
}

export type TikTokPublishStatus =
  | 'PROCESSING_UPLOAD'
  | 'PROCESSING_DOWNLOAD'
  | 'SEND_TO_USER_INBOX'
  | 'PUBLISH_COMPLETE'
  | 'FAILED';

export interface TikTokPublishStatusRequest {
  publishId: string;
}

export interface TikTokPublishStatusResponse {
  status: TikTokPublishStatus;
  fail_reason: string;
  publicaly_available_post_id: number[];
  uploaded_bytes: number;
  downloaded_bytes: number;
  platform: 'tiktok';
}

export interface TikTokApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

// ============================================================================
// API Functions
// ============================================================================

const connectTikTok = async () => {
  const response = await api.get('/platform/tiktok/oauth');
  return response.data;
};

const getTikTokUserInfo = async (): Promise<TikTokUserInfoResponse> => {
  const response = await api.get('/platform/tiktok/user');
  return response.data;
};

const getTikTokVideoList = async (
  params: TikTokVideoListRequest,
): Promise<TikTokVideoListResponse> => {
  const response = await api.post('/platform/tiktok/videos', params);
  return response.data;
};

const queryTikTokVideos = async (
  params: TikTokVideoQueryRequest,
): Promise<TikTokVideoQueryResponse> => {
  const response = await api.post('/platform/tiktok/videos/query', params);
  return response.data;
};

const uploadDraftToTikTok = async (
  data: TikTokUploadDraftRequest,
): Promise<TikTokUploadDraftResponse> => {
  const response = await api.post('/platform/tiktok/upload-draft', data);
  return response.data;
};

const getTikTokPublishStatus = async (
  params: TikTokPublishStatusRequest,
): Promise<TikTokPublishStatusResponse> => {
  const response = await api.post('/platform/tiktok/publish-status', params);
  return response.data;
};

// ============================================================================
// Query Keys
// ============================================================================

export const tiktokKeys = {
  all: ['tiktok'] as const,
  userInfo: () => [...tiktokKeys.all, 'user-info'] as const,
  videos: () => [...tiktokKeys.all, 'videos'] as const,
  videoList: (cursor?: number) =>
    [...tiktokKeys.videos(), 'list', cursor] as const,
  videoQuery: (videoIds: string[]) =>
    [...tiktokKeys.videos(), 'query', ...videoIds] as const,
  publishStatus: (publishId: string) =>
    [...tiktokKeys.all, 'publish-status', publishId] as const,
};

// ============================================================================
// Hooks
// ============================================================================

export const useTikTokIntegration = () => {
  return useMutation({
    mutationFn: connectTikTok,
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      console.error(`Error connecting TikTok account: ${error.message}`);
    },
  });
};

export const useTikTokUserInfo = (
  enabled = true,
): UseQueryResult<TikTokUserInfoResponse, AxiosError<TikTokApiError>> => {
  return useQuery({
    queryKey: tiktokKeys.userInfo(),
    queryFn: getTikTokUserInfo,
    enabled,
  });
};

export const useTikTokVideoList = (): UseMutationResult<
  TikTokVideoListResponse,
  AxiosError<TikTokApiError>,
  TikTokVideoListRequest
> => {
  return useMutation({
    mutationFn: getTikTokVideoList,
    onError: (error) => {
      console.error(
        'Failed to fetch TikTok videos:',
        error.response?.data?.message || error.message,
      );
    },
  });
};

export const useTikTokVideoQuery = (): UseMutationResult<
  TikTokVideoQueryResponse,
  AxiosError<TikTokApiError>,
  TikTokVideoQueryRequest
> => {
  return useMutation({
    mutationFn: queryTikTokVideos,
    onError: (error) => {
      console.error(
        'Failed to query TikTok videos:',
        error.response?.data?.message || error.message,
      );
    },
  });
};

export const useTikTokUploadDraft = (): UseMutationResult<
  TikTokUploadDraftResponse,
  AxiosError<TikTokApiError>,
  TikTokUploadDraftRequest
> => {
  return useMutation({
    mutationFn: uploadDraftToTikTok,
    onError: (error) => {
      console.error(
        'Failed to upload draft to TikTok:',
        error.response?.data?.message || error.message,
      );
    },
  });
};

export const useTikTokPublishStatus = (): UseMutationResult<
  TikTokPublishStatusResponse,
  AxiosError<TikTokApiError>,
  TikTokPublishStatusRequest
> => {
  return useMutation({
    mutationFn: getTikTokPublishStatus,
    onError: (error) => {
      console.error(
        'Failed to fetch TikTok publish status:',
        error.response?.data?.message || error.message,
      );
    },
  });
};
