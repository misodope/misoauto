import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { SocialAccountWriter } from '@backend/social-accounts/repository/social-account-writer';
import { SocialAccountReader } from '@backend/social-accounts/repository/social-account-reader';
import { PlatformReader } from '../repository/platform-reader';
import { PlatformType } from '@prisma/client';
import { VideoPostDraftWriter } from '@backend/video-posts/repository/video-post-draft-writer';

export interface TikTokOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
}

export interface TikTokTokenResponse {
  access_token: string;
  expires_in: number;
  open_id: string;
  refresh_expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

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

export interface TikTokVideoListResponse {
  videos: TikTokVideo[];
  cursor: number;
  has_more: boolean;
}

export interface TikTokVideoQueryResponse {
  videos: TikTokVideo[];
}

export interface TikTokPublishResponse {
  publish_id: string;
  upload_url?: string;
}

export type TikTokPublishStatus =
  | 'PROCESSING_UPLOAD'
  | 'PROCESSING_DOWNLOAD'
  | 'SEND_TO_USER_INBOX'
  | 'PUBLISH_COMPLETE'
  | 'FAILED';

export interface TikTokPublishStatusResponse {
  status: TikTokPublishStatus;
  fail_reason: string;
  publicaly_available_post_id: number[];
  uploaded_bytes: number;
  downloaded_bytes: number;
}

@Injectable()
export class PlatformConnectTikTokService {
  private readonly logger = new Logger(PlatformConnectTikTokService.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: TikTokOAuthConfig;

  constructor(
    private readonly socialAccountWriter: SocialAccountWriter,
    private readonly socialAccountReader: SocialAccountReader,
    private readonly platformReader: PlatformReader,
    private readonly videoPostDraftWriter: VideoPostDraftWriter,
  ) {
    this.config = {
      clientId: process.env.TIKTOK_CLIENT_ID || '',
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
      redirectUri:
        process.env.TIKTOK_REDIRECT_URI ||
        'https://darrel-unexcruciating-trent.ngrok-free.dev/api/v1/platform/tiktok/redirect',
      scope:
        'user.info.basic,video.list,video.upload,video.publish,user.info.profile,user.info.stats',
    };

    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    this.httpClient.interceptors.request.use(
      (config) => {
        this.logger.debug(`Making request to: ${config.url}`);
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
        this.logger.error('TikTok API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });
        return Promise.reject(error);
      },
    );
  }

  generateAuthUrl(state?: string): string {
    const params = {
      client_key: this.config.clientId,
      scope: this.config.scope,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      state: state || Math.random().toString(36).substring(7),
    };

    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?${new URLSearchParams(params).toString()}`;
    this.logger.log(`Generated TikTok auth URL: ${authUrl}`);

    return authUrl;
  }

  async exchangeCodeForToken(code: string): Promise<TikTokTokenResponse> {
    try {
      this.logger.log('Exchanging authorization code for access token');

      const tokenData = {
        client_key: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
      };

      const response = await this.httpClient.post(
        'https://open.tiktokapis.com/v2/oauth/token/',
        new URLSearchParams(tokenData).toString(),
      );

      if (response.data.error) {
        throw new BadRequestException(
          `TikTok OAuth error: ${response.data.error_description}`,
        );
      }

      this.logger.log('Successfully exchanged code for token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to exchange code for token:', error);
      throw new BadRequestException('Failed to authenticate with TikTok');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<TikTokTokenResponse> {
    try {
      this.logger.log('Refreshing TikTok access token');

      const tokenData = {
        client_key: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      };

      const response = await this.httpClient.post(
        'https://open.tiktokapis.com/v2/oauth/token/',
        new URLSearchParams(tokenData).toString(),
      );

      if (response.data.error) {
        throw new BadRequestException(
          `TikTok token refresh error: ${response.data.error_description}`,
        );
      }

      this.logger.log('Successfully refreshed access token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to refresh access token:', error);
      throw new BadRequestException('Failed to refresh TikTok token');
    }
  }

  async getUserInfo(accessToken: string): Promise<TikTokUserInfo> {
    try {
      this.logger.log('Fetching TikTok user information');

      // Fields available with user.info.basic scope
      // Additional fields require: user.info.profile (bio, profile_deep_link) or user.info.stats (follower/following counts)
      const fields =
        'open_id,union_id,avatar_url,avatar_url_100,avatar_large_url,display_name';

      const response = await this.httpClient.get(
        `https://open.tiktokapis.com/v2/user/info/?fields=${fields}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.data.error && response.data.error.code !== 'ok') {
        throw new BadRequestException(
          `TikTok API error: ${response.data.error.message}`,
        );
      }

      this.logger.log('Successfully fetched user information');
      return response.data.data.user;
    } catch (error) {
      this.logger.error('Failed to fetch user information:', error);
      throw new BadRequestException('Failed to fetch TikTok user information');
    }
  }

  async getAccessTokenForUser(userId: number): Promise<string> {
    const platform = await this.platformReader.findByName(PlatformType.TIKTOK);
    if (!platform) {
      throw new BadRequestException('TikTok platform not found');
    }

    const accounts = await this.socialAccountReader.findByUserAndPlatform(
      userId,
      platform.id,
    );

    if (!accounts.length) {
      throw new BadRequestException('No TikTok account connected');
    }

    return accounts[0].accessToken;
  }

  async getVideoList(
    accessToken: string,
    cursor?: number,
    maxCount?: number,
  ): Promise<TikTokVideoListResponse> {
    try {
      this.logger.log('Fetching TikTok video list');

      const fields =
        'id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,embed_html,embed_link,like_count,comment_count,share_count,view_count';

      const body: Record<string, unknown> = {};
      if (cursor) body.cursor = cursor;
      if (maxCount) body.max_count = maxCount;

      const response = await this.httpClient.post(
        `https://open.tiktokapis.com/v2/video/list/?fields=${fields}`,
        body,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.error && response.data.error.code !== 'ok') {
        throw new BadRequestException(
          `TikTok API error: ${response.data.error.message}`,
        );
      }

      this.logger.log('Successfully fetched video list');
      return response.data.data;
    } catch (error) {
      this.logger.error('Failed to fetch video list:', error);
      throw new BadRequestException('Failed to fetch TikTok video list');
    }
  }

  async queryVideos(
    accessToken: string,
    videoIds: string[],
  ): Promise<TikTokVideoQueryResponse> {
    try {
      this.logger.log(`Querying TikTok videos: ${videoIds.join(', ')}`);

      if (videoIds.length > 20) {
        throw new BadRequestException('Maximum 20 video IDs per request');
      }

      const fields =
        'id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,embed_html,embed_link,like_count,comment_count,share_count,view_count';

      const response = await this.httpClient.post(
        `https://open.tiktokapis.com/v2/video/query/?fields=${fields}`,
        { filters: { video_ids: videoIds } },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.error && response.data.error.code !== 'ok') {
        throw new BadRequestException(
          `TikTok API error: ${response.data.error.message}`,
        );
      }

      this.logger.log('Successfully queried videos');
      return response.data.data;
    } catch (error) {
      this.logger.error('Failed to query videos:', error);
      throw new BadRequestException('Failed to query TikTok videos');
    }
  }

  async initializeVideoUploadDraft(
    accessToken: string,
    videoUrl: string,
    videoId: number,
  ): Promise<TikTokPublishResponse> {
    try {
      this.logger.log('Initializing TikTok video upload via PULL_FROM_URL');

      const response = await this.httpClient.post(
        'https://open.tiktokapis.com/v2/post/publish/inbox/video/init/',
        {
          source_info: {
            source: 'PULL_FROM_URL',
            video_url: videoUrl,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
          },
        },
      );

      if (response.data.error && response.data.error.code !== 'ok') {
        throw new BadRequestException(
          `TikTok API error: ${response.data.error.message}`,
        );
      }

      await this.videoPostDraftWriter.create({
        video: {
          connect: {
            id: videoId,
          },
        },
        platformVideoId: response.data.data.publish_id,
      });

      this.logger.log(
        `Successfully initialized upload, publish_id: ${response.data.data.publish_id}`,
      );
      return response.data.data;
    } catch (error) {
      this.logger.error('Failed to initialize video upload:', error);
      throw new BadRequestException('Failed to initialize TikTok video upload');
    }
  }

  async getPublishStatus(
    accessToken: string,
    publishId: string,
  ): Promise<TikTokPublishStatusResponse> {
    try {
      this.logger.log(`Fetching publish status for ${publishId}`);

      const response = await this.httpClient.post(
        'https://open.tiktokapis.com/v2/post/publish/status/fetch/',
        { publish_id: publishId },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
          },
        },
      );

      if (response.data.error && response.data.error.code !== 'ok') {
        throw new BadRequestException(
          `TikTok API error: ${response.data.error.message}`,
        );
      }

      this.logger.log(
        `Publish status for ${publishId}: ${response.data.data.status}`,
      );
      return response.data.data;
    } catch (error) {
      this.logger.error('Failed to fetch publish status:', error);
      throw new BadRequestException('Failed to fetch TikTok publish status');
    }
  }

  async revokeToken(accessToken: string): Promise<void> {
    try {
      this.logger.log('Revoking TikTok access token');

      const tokenData = {
        client_key: this.config.clientId,
        client_secret: this.config.clientSecret,
        token: accessToken,
      };

      await this.httpClient.post(
        'https://open.tiktokapis.com/v2/oauth/revoke/',
        new URLSearchParams(tokenData).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.logger.log('Successfully revoked access token');
    } catch (error) {
      this.logger.error('Failed to revoke access token:', error);
      throw new BadRequestException('Failed to revoke TikTok token');
    }
  }

  async saveOAuthAccount(params: {
    userId: number;
    tokenResponse: TikTokTokenResponse;
  }) {
    try {
      this.logger.log('Saving TikTok OAuth account to database');

      // Get TikTok platform
      const platform = await this.platformReader.findByName(
        PlatformType.TIKTOK,
      );
      if (!platform) {
        throw new BadRequestException('TikTok platform not found in database');
      }

      // Calculate token expiry
      const tokenExpiry = new Date(
        Date.now() + params.tokenResponse.expires_in * 1000,
      );

      // Fetch user info to get username
      const userInfo = await this.getUserInfo(
        params.tokenResponse.access_token,
      );

      // Check if account already exists
      const existingAccount =
        await this.socialAccountReader.findByPlatformAndAccountId(
          platform.id,
          params.tokenResponse.open_id,
        );

      let savedAccount;
      if (existingAccount) {
        // Update existing account with new tokens
        this.logger.log(
          `Updating existing TikTok account ${existingAccount.id}`,
        );
        savedAccount = await this.socialAccountWriter.updateTokens({
          id: existingAccount.id,
          accessToken: params.tokenResponse.access_token,
          refreshToken: params.tokenResponse.refresh_token,
          tokenExpiry,
        });
      } else {
        // Create new account
        this.logger.log('Creating new TikTok account');
        savedAccount = await this.socialAccountWriter.create({
          user: { connect: { id: params.userId } },
          platform: { connect: { id: platform.id } },
          accessToken: params.tokenResponse.access_token,
          refreshToken: params.tokenResponse.refresh_token,
          tokenExpiry,
          accountId: params.tokenResponse.open_id,
          username: userInfo.display_name,
        });
      }

      return savedAccount;
    } catch (error) {
      this.logger.error('Failed to save TikTok account:', error);
      throw new BadRequestException('Failed to save TikTok account');
    }
  }
}
