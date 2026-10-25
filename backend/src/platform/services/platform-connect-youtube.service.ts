import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { SocialAccountWriter } from '../../social-accounts/repository/social-account-writer';
import { SocialAccountReader } from '../../social-accounts/repository/social-account-reader';
import { PlatformReader } from '../repository/platform-reader';
import { SocialAccountWithRelations } from '../../social-accounts/repository/social-account-reader';
import { VideoPostDraftReader } from '../../video-posts/repository/video-post-draft-reader';
import { VideoPostDraftWriter } from '../../video-posts/repository/video-post-draft-writer';
import { VideoPostWriter } from '../../video-posts/repository/video-post-writer';
import { BlobStorageService } from '../../system/blob-storage/blob-storage.service';
import { PlatformType, PostStatus } from '@backend/generated/prisma/client';

const API_URL = 'https://www.googleapis.com/youtube/v3';
const UPLOAD_URL = 'https://www.googleapis.com/upload/youtube/v3';
const TOKEN_URL = 'https://oauth2.googleapis.com';

// Refresh access tokens that expire within this window before using them.
const TOKEN_REFRESH_SKEW_MS = 5 * 60 * 1000;

const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_BYTES = 5000;
const THUMBNAIL_MAX_BYTES = 2 * 1024 * 1024;
const THUMBNAIL_MIME_TYPES = ['image/jpeg', 'image/png'];

const redactSensitiveUrl = (url?: string): string | undefined =>
  url?.replace(
    /([?&](?:access_token|client_secret|refresh_token|code|token)=)[^&]*/gi,
    '$1[REDACTED]',
  );

export interface YouTubeOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
}

export interface YouTubeTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

export interface YouTubeChannelInfo {
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl: string;
    publishedAt: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    country?: string;
  };
  statistics: {
    viewCount: string;
    subscriberCount: string;
    hiddenSubscriberCount: boolean;
    videoCount: string;
  };
  contentDetails: {
    relatedPlaylists: {
      uploads: string;
    };
  };
}

export interface YouTubeUploadResponse {
  videoId: string;
  title: string;
  status: string;
}

export type YouTubeProcessingStatus =
  'processing' | 'succeeded' | 'failed' | 'terminated';

export type YouTubePublishPrivacyStatus = 'public' | 'unlisted';

export interface YouTubeVideoStatusResponse {
  videoId: string;
  processingStatus: YouTubeProcessingStatus;
  uploadStatus: string;
  privacyStatus: string;
  failureReason?: string;
}

export interface YouTubePublishResponse {
  videoId: string;
  url: string;
  privacyStatus: YouTubePublishPrivacyStatus;
}

interface GoogleApiErrorResponse {
  error?:
    | string
    | {
        message?: string;
        errors?: { reason?: string; message?: string }[];
      };
  error_description?: string;
}

export interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
      standard?: { url: string; width: number; height: number };
      maxres?: { url: string; width: number; height: number };
    };
    channelId: string;
    channelTitle: string;
    tags?: string[];
    categoryId: string;
    liveBroadcastContent: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
  contentDetails: {
    duration: string;
    dimension: string;
    definition: string;
    caption: string;
  };
}

@Injectable()
export class PlatformConnectYouTubeService {
  private readonly logger = new Logger(PlatformConnectYouTubeService.name);
  private readonly httpClient: AxiosInstance;
  private readonly uploadClient: AxiosInstance;
  private readonly config: YouTubeOAuthConfig;

  constructor(
    private readonly socialAccountWriter: SocialAccountWriter,
    private readonly socialAccountReader: SocialAccountReader,
    private readonly platformReader: PlatformReader,
    private readonly videoPostDraftWriter: VideoPostDraftWriter,
    private readonly videoPostDraftReader: VideoPostDraftReader,
    private readonly videoPostWriter: VideoPostWriter,
    private readonly blobStorage: BlobStorageService,
  ) {
    const isDev = process.env.NODE_ENV !== 'production';

    this.config = {
      clientId: process.env.YOUTUBE_CLIENT_ID || '',
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
      redirectUri:
        (isDev && process.env.YOUTUBE_REDIRECT_URI_DEV) ||
        process.env.YOUTUBE_REDIRECT_URI ||
        '',
      // youtube.force-ssl is required for videos.update (publishing a
      // private upload); readonly/upload cover channel info and inserts.
      scope: [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.force-ssl',
      ].join(' '),
    };

    if (!this.config.clientId) {
      this.logger.warn('YouTube client ID is not configured');
    }
    if (!this.config.redirectUri) {
      this.logger.warn('YouTube redirect URI is not configured');
    }

    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    this.httpClient.interceptors.request.use(
      (config) => {
        this.logger.debug(
          `Making request to: ${redactSensitiveUrl(config.url)}`,
        );
        return config;
      },
      (error) => {
        this.logger.error('Request error:', error);
        return Promise.reject(error);
      },
    );

    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        this.logger.error('YouTube API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          url: redactSensitiveUrl(error.config?.url),
        });
        return Promise.reject(error);
      },
    );

    // Dedicated upload client — no timeout, supports large streaming bodies
    this.uploadClient = axios.create({
      timeout: 0,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
  }

  generateAuthUrl(state?: string): string {
    const params = {
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      state: state || Math.random().toString(36).substring(7),
    };

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams(params).toString()}`;
    this.logger.log(`Generated YouTube auth URL: ${authUrl}`);

    return authUrl;
  }

  async exchangeCodeForToken(code: string): Promise<YouTubeTokenResponse> {
    try {
      this.logger.log('Exchanging authorization code for access token');

      const tokenData = {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
      };

      const response = await this.httpClient.post(
        `${TOKEN_URL}/token`,
        new URLSearchParams(tokenData).toString(),
      );

      if (response.data.error) {
        throw new BadRequestException(
          this.getGoogleErrorMessage(response.data),
        );
      }

      this.logger.log('Successfully exchanged code for token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to exchange code for token:', error);
      throw new BadRequestException(
        this.getGoogleErrorMessage(
          error,
          'Failed to authenticate with YouTube',
        ),
      );
    }
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<YouTubeTokenResponse> {
    try {
      this.logger.log('Refreshing YouTube access token');

      const tokenData = {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      };

      const response = await this.httpClient.post(
        `${TOKEN_URL}/token`,
        new URLSearchParams(tokenData).toString(),
      );

      if (response.data.error) {
        throw new BadRequestException(
          this.getGoogleErrorMessage(response.data),
        );
      }

      this.logger.log('Successfully refreshed access token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to refresh access token:', error);
      throw new BadRequestException(
        this.getGoogleErrorMessage(error, 'Failed to refresh YouTube token'),
      );
    }
  }

  async saveOAuthAccount(params: {
    userId: number;
    tokenResponse: YouTubeTokenResponse;
  }) {
    try {
      this.logger.log('Saving YouTube OAuth account');

      // Get YouTube platform
      const platform = await this.platformReader.findByName(
        PlatformType.YOUTUBE,
      );
      if (!platform) {
        throw new BadRequestException('YouTube platform not found in database');
      }

      // Calculate token expiry
      const tokenExpiry = new Date(
        Date.now() + params.tokenResponse.expires_in * 1000,
      );

      // Fetch channel info to get channel ID and username
      const channelInfo = await this.getChannelInfo(
        params.tokenResponse.access_token,
      );

      // Check if account already exists
      const existingAccount =
        await this.socialAccountReader.findIncludingDeletedByPlatformAndAccountId(
          platform.id,
          channelInfo.id,
        );

      let savedAccount;
      if (existingAccount) {
        if (existingAccount.userId !== params.userId) {
          throw new ConflictException('YouTube account is already connected');
        }

        // Update existing account with new tokens
        this.logger.log(
          `Updating existing YouTube account ${existingAccount.id}`,
        );

        // YouTube may return a new refresh token, use it if provided
        const newRefreshToken =
          params.tokenResponse.refresh_token ||
          existingAccount.refreshToken ||
          undefined;

        savedAccount = existingAccount.deletedAt
          ? await this.socialAccountWriter.reactivateWithTokens({
              id: existingAccount.id,
              userId: params.userId,
              accessToken: params.tokenResponse.access_token,
              refreshToken: newRefreshToken,
              tokenExpiry,
            })
          : await this.socialAccountWriter.updateTokens({
              id: existingAccount.id,
              accessToken: params.tokenResponse.access_token,
              refreshToken: newRefreshToken,
              tokenExpiry,
              expectedTokenVersion: existingAccount.tokenVersion,
            });

        if (!savedAccount) {
          throw new ConflictException(
            'YouTube account changed while connecting; please try again',
          );
        }
      } else {
        // Create new account
        this.logger.log('Creating new YouTube account');
        savedAccount = await this.socialAccountWriter.create({
          user: { connect: { id: params.userId } },
          platform: { connect: { id: platform.id } },
          accessToken: params.tokenResponse.access_token,
          refreshToken: params.tokenResponse.refresh_token || undefined,
          tokenExpiry,
          accountId: channelInfo.id,
          username: channelInfo.snippet.title,
        });
      }

      this.logger.log('Successfully saved YouTube account');
      return savedAccount;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Failed to save YouTube account:', error);
      throw new BadRequestException('Failed to save YouTube account');
    }
  }

  async getChannelInfo(accessToken: string): Promise<YouTubeChannelInfo> {
    try {
      this.logger.log('Fetching YouTube channel information');

      const params = {
        part: 'snippet,statistics,contentDetails',
        mine: 'true',
      };

      const response = await this.httpClient.get(
        `${API_URL}/channels?${new URLSearchParams(params).toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.data.error) {
        throw new BadRequestException(
          `YouTube API error: ${response.data.error.message}`,
        );
      }

      if (!response.data.items || response.data.items.length === 0) {
        throw new BadRequestException(
          'No YouTube channel found for this account',
        );
      }

      this.logger.log('Successfully fetched channel information');
      return response.data.items[0];
    } catch (error) {
      this.logger.error('Failed to fetch channel information:', error);
      throw new BadRequestException(
        this.getGoogleErrorMessage(
          error,
          'Failed to fetch YouTube channel information',
        ),
      );
    }
  }

  async getChannelVideos(
    accessToken: string,
    maxResults: number = 25,
  ): Promise<YouTubeVideo[]> {
    try {
      this.logger.log('Fetching YouTube channel videos');

      const channelInfo = await this.getChannelInfo(accessToken);
      const uploadsPlaylistId =
        channelInfo.contentDetails.relatedPlaylists.uploads;

      const playlistParams = {
        part: 'snippet',
        playlistId: uploadsPlaylistId,
        maxResults: maxResults.toString(),
      };

      const playlistResponse = await this.httpClient.get(
        `${API_URL}/playlistItems?${new URLSearchParams(playlistParams).toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (playlistResponse.data.error) {
        throw new BadRequestException(
          `YouTube API error: ${playlistResponse.data.error.message}`,
        );
      }

      const videoIds = playlistResponse.data.items.map(
        (item: any) => item.snippet.resourceId.videoId,
      );

      if (videoIds.length === 0) {
        return [];
      }

      const videoParams = {
        part: 'snippet,statistics,contentDetails',
        id: videoIds.join(','),
      };

      const videosResponse = await this.httpClient.get(
        `${API_URL}/videos?${new URLSearchParams(videoParams).toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (videosResponse.data.error) {
        throw new BadRequestException(
          `YouTube API error: ${videosResponse.data.error.message}`,
        );
      }

      this.logger.log('Successfully fetched channel videos');
      return videosResponse.data.items || [];
    } catch (error) {
      this.logger.error('Failed to fetch channel videos:', error);
      throw new BadRequestException('Failed to fetch YouTube channel videos');
    }
  }

  async getVideoById(
    videoId: string,
    accessToken: string,
  ): Promise<YouTubeVideo> {
    try {
      this.logger.log(`Fetching YouTube video details for ID: ${videoId}`);

      const params = {
        part: 'snippet,statistics,contentDetails',
        id: videoId,
      };

      const response = await this.httpClient.get(
        `${API_URL}/videos?${new URLSearchParams(params).toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.data.error) {
        throw new BadRequestException(
          `YouTube API error: ${response.data.error.message}`,
        );
      }

      if (!response.data.items || response.data.items.length === 0) {
        throw new BadRequestException('Video not found');
      }

      this.logger.log('Successfully fetched video details');
      return response.data.items[0];
    } catch (error) {
      this.logger.error('Failed to fetch video details:', error);
      throw new BadRequestException('Failed to fetch YouTube video details');
    }
  }

  async getAccessTokenForUser(userId: number): Promise<string> {
    const account = await this.getAccountForUser(userId);
    return account.accessToken;
  }

  /**
   * Returns the user's YouTube account with a usable access token. Google
   * access tokens live for one hour while the refresh cron only runs every
   * 12 hours, so tokens that are expired (or about to be) are refreshed here.
   */
  async getAccountForUser(
    userId: number,
  ): Promise<SocialAccountWithRelations & { accessToken: string }> {
    const platform = await this.platformReader.findByName(PlatformType.YOUTUBE);
    if (!platform) {
      throw new BadRequestException('YouTube platform not found');
    }

    const accounts = await this.socialAccountReader.findByUserAndPlatform(
      userId,
      platform.id,
    );

    if (!accounts.length) {
      throw new BadRequestException('No YouTube account connected');
    }

    const account = accounts[0];
    const expiresSoon =
      !account.tokenExpiry ||
      account.tokenExpiry.getTime() - Date.now() <= TOKEN_REFRESH_SKEW_MS;

    if (!account.accessToken) {
      throw new BadRequestException('YouTube account has no usable token');
    }

    if (!expiresSoon || !account.refreshToken) {
      return account as SocialAccountWithRelations & { accessToken: string };
    }

    this.logger.log(
      `Refreshing expiring YouTube token for account ${account.id}`,
    );
    const tokenResponse = await this.refreshAccessToken(account.refreshToken);
    const tokenExpiry = new Date(Date.now() + tokenResponse.expires_in * 1000);
    const refreshToken = tokenResponse.refresh_token || account.refreshToken;

    const updated = await this.socialAccountWriter.updateTokens({
      id: account.id,
      accessToken: tokenResponse.access_token,
      refreshToken,
      tokenExpiry,
      expectedTokenVersion: account.tokenVersion,
    });

    if (!updated) {
      throw new BadRequestException('YouTube account changed during refresh');
    }

    return {
      ...account,
      accessToken: tokenResponse.access_token,
      refreshToken,
      tokenExpiry,
    } as SocialAccountWithRelations & { accessToken: string };
  }

  async initializeVideoUpload(params: {
    accessToken: string;
    s3Key: string;
    videoId: number;
    title: string;
    description: string;
    madeForKids?: boolean;
    thumbnailKey?: string | null;
  }): Promise<YouTubeUploadResponse> {
    const { accessToken, s3Key, videoId, title, description } = params;

    try {
      this.logger.log(`Initializing YouTube upload for video ${videoId}`);
      const platform = await this.platformReader.findByName(
        PlatformType.YOUTUBE,
      );
      if (!platform) {
        throw new BadRequestException('YouTube platform not found in database');
      }

      // Step 1: Get stream + metadata from R2
      const { stream, contentLength, contentType } =
        await this.blobStorage.downloadStream(s3Key);

      // Step 2: Initialize resumable upload session — get the upload URI
      const initResponse = await this.httpClient.post(
        `${UPLOAD_URL}/videos?uploadType=resumable&part=snippet,status`,
        {
          snippet: {
            title,
            description,
            categoryId: '22', // People & Blogs — sensible default
          },
          status: {
            // Always upload privately; publishVideo flips visibility once
            // YouTube has finished processing.
            privacyStatus: 'private',
            selfDeclaredMadeForKids: params.madeForKids ?? false,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Upload-Content-Type': contentType,
            'X-Upload-Content-Length': contentLength,
          },
        },
      );

      const uploadUri = initResponse.headers['location'];
      if (!uploadUri) {
        throw new BadRequestException('YouTube did not return an upload URI');
      }

      this.logger.log(
        `Got YouTube upload URI, streaming ${contentLength} bytes`,
      );

      // Step 3: Stream video bytes from R2 directly to YouTube
      const uploadResponse = await this.uploadClient.put(uploadUri, stream, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': contentLength,
        },
      });

      const youtubeVideoId: string = uploadResponse.data.id;
      if (!youtubeVideoId) {
        throw new BadRequestException('YouTube did not return a video ID');
      }

      this.logger.log(`YouTube upload complete, videoId: ${youtubeVideoId}`);

      if (params.thumbnailKey) {
        await this.setThumbnail(
          accessToken,
          youtubeVideoId,
          params.thumbnailKey,
        );
      }

      // Step 4: Save draft record (mirrors TikTok's initializeVideoUploadDraft)
      await this.videoPostDraftWriter.create({
        video: { connect: { id: videoId } },
        platform: {
          connect: {
            id: platform.id,
          },
        },
        platformVideoId: youtubeVideoId,
      });

      return {
        videoId: youtubeVideoId,
        title: uploadResponse.data.snippet?.title ?? title,
        status: uploadResponse.data.status?.uploadStatus ?? 'uploaded',
      };
    } catch (error) {
      this.logger.error('Failed to upload video to YouTube:', error);
      throw new BadRequestException(
        this.getGoogleErrorMessage(error, 'Failed to upload video to YouTube'),
      );
    }
  }

  async getVideoProcessingStatus(
    accessToken: string,
    youtubeVideoId: string,
  ): Promise<YouTubeVideoStatusResponse> {
    try {
      this.logger.log(
        `Fetching processing status for YouTube video ${youtubeVideoId}`,
      );

      const params = new URLSearchParams({
        part: 'status,processingDetails',
        id: youtubeVideoId,
      });

      const response = await this.httpClient.get(
        `${API_URL}/videos?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (!response.data.items || response.data.items.length === 0) {
        throw new BadRequestException('YouTube video not found');
      }

      const item = response.data.items[0];
      const processingStatus: YouTubeProcessingStatus =
        item.processingDetails?.processingStatus ?? 'processing';
      const uploadStatus: string = item.status?.uploadStatus ?? 'uploaded';

      this.logger.log(
        `Processing status for ${youtubeVideoId}: ${processingStatus} (upload: ${uploadStatus})`,
      );

      if (processingStatus === 'succeeded') {
        const draft =
          await this.videoPostDraftReader.findByPlatformVideoId(youtubeVideoId);
        if (draft && !draft.uploadCompletedAt) {
          await this.videoPostDraftWriter.markUploadCompleted(draft.id);
        }
      }

      return {
        videoId: youtubeVideoId,
        // A rejected or failed upload can stay in "processing"; surface it as
        // failed so clients stop polling.
        processingStatus:
          uploadStatus === 'rejected' || uploadStatus === 'failed'
            ? 'failed'
            : processingStatus,
        uploadStatus,
        privacyStatus: item.status?.privacyStatus ?? 'private',
        failureReason:
          item.status?.rejectionReason ??
          item.status?.failureReason ??
          item.processingDetails?.processingFailureReason,
      };
    } catch (error) {
      this.logger.error('Failed to fetch YouTube video status:', error);
      throw new BadRequestException(
        this.getGoogleErrorMessage(
          error,
          'Failed to fetch YouTube video processing status',
        ),
      );
    }
  }

  async publishVideo(params: {
    accessToken: string;
    youtubeVideoId: string;
    privacyStatus: YouTubePublishPrivacyStatus;
    videoId: number;
    platformId: number;
    socialAccountId: number;
  }): Promise<YouTubePublishResponse> {
    const { accessToken, youtubeVideoId, privacyStatus } = params;

    try {
      this.logger.log(
        `Publishing YouTube video ${youtubeVideoId} as ${privacyStatus}`,
      );

      // videos.update replaces the whole status part, so start from the
      // current values to avoid resetting license, embeddable, etc.
      const currentResponse = await this.httpClient.get(
        `${API_URL}/videos?${new URLSearchParams({
          part: 'status',
          id: youtubeVideoId,
        }).toString()}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      const current = currentResponse.data.items?.[0];
      if (!current) {
        throw new BadRequestException('YouTube video not found');
      }

      const {
        embeddable,
        license,
        publicStatsViewable,
        selfDeclaredMadeForKids,
        containsSyntheticMedia,
      } = current.status ?? {};

      await this.httpClient.put(
        `${API_URL}/videos?part=status`,
        {
          id: youtubeVideoId,
          status: {
            embeddable,
            license,
            publicStatsViewable,
            selfDeclaredMadeForKids,
            containsSyntheticMedia,
            privacyStatus,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const url = `https://www.youtube.com/watch?v=${youtubeVideoId}`;

      await this.videoPostWriter.createForActiveAccount(
        {
          video: { connect: { id: params.videoId } },
          platform: { connect: { id: params.platformId } },
          socialAccount: { connect: { id: params.socialAccountId } },
          platformPostId: youtubeVideoId,
          postUrl: url,
          status: PostStatus.PUBLISHED,
          postedAt: new Date(),
        },
        params.socialAccountId,
      );

      return { videoId: youtubeVideoId, url, privacyStatus };
    } catch (error) {
      this.logger.error('Failed to publish YouTube video:', error);
      throw new BadRequestException(
        this.getGoogleErrorMessage(error, 'Failed to publish YouTube video'),
      );
    }
  }

  async getProcessingStatusForUser(
    userId: number,
    youtubeVideoId: string,
  ): Promise<YouTubeVideoStatusResponse> {
    const draft = await this.getOwnedDraft(userId, youtubeVideoId);
    const account = await this.getAccountForUser(userId);
    return this.getVideoProcessingStatus(
      account.accessToken,
      draft.platformVideoId,
    );
  }

  async publishForUser(
    userId: number,
    youtubeVideoId: string,
    privacyStatus: YouTubePublishPrivacyStatus,
  ): Promise<YouTubePublishResponse> {
    const draft = await this.getOwnedDraft(userId, youtubeVideoId);
    const account = await this.getAccountForUser(userId);
    return this.publishVideo({
      accessToken: account.accessToken,
      youtubeVideoId: draft.platformVideoId,
      privacyStatus,
      videoId: draft.videoId,
      platformId: account.platformId,
      socialAccountId: account.id,
    });
  }

  /**
   * Looks up a YouTube upload draft owned by the user. Drafts belonging to
   * other users or platforms are reported as missing rather than forbidden so
   * IDs cannot be probed.
   */
  private async getOwnedDraft(userId: number, youtubeVideoId: string) {
    const draft =
      await this.videoPostDraftReader.findByPlatformVideoId(youtubeVideoId);

    if (
      !draft ||
      draft.video.userId !== userId ||
      draft.platform?.name !== PlatformType.YOUTUBE
    ) {
      throw new NotFoundException('YouTube draft not found');
    }

    return draft;
  }

  validateYouTubeVideo(
    video: { mimeType?: string | null },
    metadata: { title: string; description?: string | null },
  ): void {
    if (video.mimeType != null && !video.mimeType.startsWith('video/')) {
      throw new BadRequestException('YouTube uploads must be a video file');
    }

    const title = metadata.title.trim();
    if (!title) {
      throw new BadRequestException('YouTube videos require a title');
    }
    if (title.length > TITLE_MAX_LENGTH) {
      throw new BadRequestException(
        `YouTube titles must be ${TITLE_MAX_LENGTH} characters or fewer`,
      );
    }
    if (/[<>]/.test(title)) {
      throw new BadRequestException('YouTube titles cannot contain < or >');
    }

    const description = metadata.description ?? '';
    if (Buffer.byteLength(description, 'utf8') > DESCRIPTION_MAX_BYTES) {
      throw new BadRequestException(
        `YouTube descriptions must be ${DESCRIPTION_MAX_BYTES} bytes or fewer`,
      );
    }
    if (/[<>]/.test(description)) {
      throw new BadRequestException(
        'YouTube descriptions cannot contain < or >',
      );
    }
  }

  /**
   * Best-effort custom thumbnail. Channels that are not phone-verified cannot
   * set custom thumbnails, so failures are logged rather than failing the
   * upload.
   */
  private async setThumbnail(
    accessToken: string,
    youtubeVideoId: string,
    thumbnailKey: string,
  ): Promise<void> {
    try {
      const { stream, contentLength, contentType } =
        await this.blobStorage.downloadStream(thumbnailKey);

      if (!THUMBNAIL_MIME_TYPES.includes(contentType)) {
        this.logger.warn(
          `Skipping YouTube thumbnail: unsupported type ${contentType}`,
        );
        stream.destroy?.();
        return;
      }
      if (Number(contentLength) > THUMBNAIL_MAX_BYTES) {
        this.logger.warn('Skipping YouTube thumbnail: larger than 2 MB');
        stream.destroy?.();
        return;
      }

      await this.uploadClient.post(
        `${UPLOAD_URL}/thumbnails/set?${new URLSearchParams({
          videoId: youtubeVideoId,
        }).toString()}`,
        stream,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': contentType,
            'Content-Length': contentLength,
          },
        },
      );
      this.logger.log(
        `Set custom thumbnail for YouTube video ${youtubeVideoId}`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to set YouTube thumbnail: ${this.getGoogleErrorMessage(error)}`,
      );
    }
  }

  async revokeToken(accessToken: string): Promise<void> {
    try {
      this.logger.log('Revoking YouTube access token');

      await this.httpClient.post(
        `${TOKEN_URL}/revoke`,
        new URLSearchParams({ token: accessToken }).toString(),
      );

      this.logger.log('Successfully revoked access token');
    } catch (error) {
      this.logger.error('Failed to revoke access token:', error);
      throw new BadRequestException('Failed to revoke YouTube token');
    }
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      await this.getChannelInfo(accessToken);
      return true;
    } catch (error) {
      this.logger.warn(
        'YouTube token validation failed:',
        (error as Error).message,
      );
      return false;
    }
  }

  private getGoogleErrorMessage(
    error: unknown,
    fallback = 'YouTube API request failed',
  ) {
    const responseData =
      (error as { response?: { data?: GoogleApiErrorResponse } })?.response
        ?.data ?? (error as GoogleApiErrorResponse);
    const apiError =
      typeof responseData?.error === 'object' ? responseData.error : undefined;
    const errorWithMessage = error as { message?: string };

    return (
      apiError?.errors?.[0]?.message ||
      apiError?.message ||
      responseData?.error_description ||
      (error instanceof BadRequestException ? error.message : undefined) ||
      errorWithMessage?.message ||
      fallback
    );
  }
}
