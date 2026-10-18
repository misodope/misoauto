import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { SocialAccountWriter } from '../../social-accounts/repository/social-account-writer';
import { SocialAccountReader } from '../../social-accounts/repository/social-account-reader';
import { PlatformReader } from '../repository/platform-reader';
import { VideoPostDraftReader } from '../../video-posts/repository/video-post-draft-reader';
import { VideoPostDraftWriter } from '../../video-posts/repository/video-post-draft-writer';
import { VideoPostWriter } from '../../video-posts/repository/video-post-writer';
import { PlatformType, PostStatus } from '@backend/generated/prisma/client';
import { SocialAccountWithRelations } from '../../social-accounts/repository/social-account-reader';

const GRAPH_URL = 'https://graph.instagram.com/v25.0';
const TOKEN_URL = 'https://graph.instagram.com';

export interface InstagramOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
}

export interface InstagramTokenResponse {
  access_token: string;
}

export interface InstagramLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface InstagramUserInfo {
  user_id: string;
  username: string;
  account_type: string;
  profile_picture_url?: string;
  followers_count?: number;
}

export type InstagramContainerStatusCode =
  'IN_PROGRESS' | 'FINISHED' | 'ERROR' | 'EXPIRED' | 'PUBLISHED';

export interface InstagramContainerStatus {
  containerId: string;
  statusCode: InstagramContainerStatusCode;
  status?: string;
}

export interface InstagramPublishingLimit {
  config?: number;
  quota_usage?: number;
  [key: string]: unknown;
}

interface InstagramApiErrorResponse {
  error?: {
    error_user_msg?: string;
    message?: string;
  };
  error_user_msg?: string;
  message?: string;
}

@Injectable()
export class PlatformConnectInstagramService {
  private readonly logger = new Logger(PlatformConnectInstagramService.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: InstagramOAuthConfig;

  constructor(
    private readonly socialAccountWriter: SocialAccountWriter,
    private readonly socialAccountReader: SocialAccountReader,
    private readonly platformReader: PlatformReader,
    private readonly videoPostDraftWriter: VideoPostDraftWriter,
    private readonly videoPostDraftReader: VideoPostDraftReader,
    private readonly videoPostWriter: VideoPostWriter,
  ) {
    const isDev = process.env.NODE_ENV !== 'production';

    this.config = {
      clientId: process.env.INSTAGRAM_CLIENT_ID || '',
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
      redirectUri:
        (isDev && process.env.INSTAGRAM_REDIRECT_URI_DEV) ||
        process.env.INSTAGRAM_REDIRECT_URI ||
        '',
      scope: 'instagram_business_basic,instagram_business_content_publish',
    };

    if (!this.config.clientId) {
      this.logger.warn('Instagram client ID is not configured');
    }
    if (!this.config.redirectUri) {
      this.logger.warn('Instagram redirect URI is not configured');
    }

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
        this.logger.error('Instagram API Error:', {
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
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope,
      response_type: 'code',
      state: state || Math.random().toString(36).substring(7),
    };

    const authUrl = `https://www.instagram.com/oauth/authorize?${new URLSearchParams(params).toString()}`;
    this.logger.log(`Generated Instagram auth URL: ${authUrl}`);

    return authUrl;
  }

  async exchangeCodeForToken(code: string): Promise<InstagramTokenResponse> {
    try {
      this.logger.log('Exchanging authorization code for access token');

      const tokenData = {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
        code: code.replace(/#_$/, ''),
      };

      const response = await this.httpClient.post(
        'https://api.instagram.com/oauth/access_token',
        new URLSearchParams(tokenData).toString(),
      );

      if (response.data.error) {
        throw new BadRequestException(
          `Instagram OAuth error: ${response.data.error_description || response.data.error.message}`,
        );
      }

      const payload = Array.isArray(response.data?.data)
        ? response.data.data[0]
        : response.data;

      if (!payload?.access_token) {
        throw new BadRequestException(
          'Instagram OAuth response did not include an access token',
        );
      }

      this.logger.log('Successfully exchanged code for short-lived token');
      return { access_token: payload.access_token };
    } catch (error) {
      this.logger.error('Failed to exchange code for token:', error);
      throw new BadRequestException(
        this.getMetaErrorMessage(
          error,
          'Failed to authenticate with Instagram',
        ),
      );
    }
  }

  async exchangeForLongLivedToken(
    shortLivedToken: string,
  ): Promise<InstagramLongLivedTokenResponse> {
    try {
      this.logger.log('Exchanging short-lived token for long-lived token');

      const params = {
        grant_type: 'ig_exchange_token',
        client_secret: this.config.clientSecret,
        access_token: shortLivedToken,
      };

      const response = await this.httpClient.get(
        `${TOKEN_URL}/access_token?${new URLSearchParams(params).toString()}`,
      );

      if (response.data.error) {
        throw new BadRequestException(this.getMetaErrorMessage(response.data));
      }

      this.logger.log('Successfully exchanged for long-lived token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to exchange for long-lived token:', error);
      throw new BadRequestException(
        this.getMetaErrorMessage(
          error,
          'Failed to get long-lived Instagram token',
        ),
      );
    }
  }

  async refreshLongLivedToken(
    accessToken: string,
  ): Promise<InstagramLongLivedTokenResponse> {
    try {
      this.logger.log('Refreshing Instagram long-lived token');

      const params = {
        grant_type: 'ig_refresh_token',
        access_token: accessToken,
      };

      const response = await this.httpClient.get(
        `${TOKEN_URL}/refresh_access_token?${new URLSearchParams(params).toString()}`,
      );

      if (response.data.error) {
        throw new BadRequestException(this.getMetaErrorMessage(response.data));
      }

      this.logger.log('Successfully refreshed long-lived token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to refresh long-lived token:', error);
      throw new BadRequestException(
        this.getMetaErrorMessage(error, 'Failed to refresh Instagram token'),
      );
    }
  }

  async saveOAuthAccount(params: { userId: number; shortLivedToken: string }) {
    try {
      this.logger.log('Saving Instagram OAuth account');

      const longLivedTokenResponse = await this.exchangeForLongLivedToken(
        params.shortLivedToken,
      );
      const userInfo = await this.getUserInfo(
        longLivedTokenResponse.access_token,
      );
      const platform = await this.platformReader.findByName(
        PlatformType.INSTAGRAM,
      );

      if (!platform) {
        throw new BadRequestException(
          'Instagram platform not found in database',
        );
      }

      const tokenExpiry = new Date(
        Date.now() + longLivedTokenResponse.expires_in * 1000,
      );
      const existingAccount =
        await this.socialAccountReader.findByPlatformAndAccountId(
          platform.id,
          userInfo.user_id,
        );

      if (existingAccount) {
        this.logger.log(
          `Updating existing Instagram account ${existingAccount.id}`,
        );
        return await this.socialAccountWriter.updateTokens({
          id: existingAccount.id,
          accessToken: longLivedTokenResponse.access_token,
          refreshToken: undefined,
          tokenExpiry,
        });
      }

      this.logger.log('Creating new Instagram account');
      return await this.socialAccountWriter.create({
        user: { connect: { id: params.userId } },
        platform: { connect: { id: platform.id } },
        accessToken: longLivedTokenResponse.access_token,
        refreshToken: undefined,
        tokenExpiry,
        accountId: userInfo.user_id,
        username: userInfo.username,
      });
    } catch (error) {
      this.logger.error('Failed to save Instagram account:', error);
      throw new BadRequestException('Failed to save Instagram account');
    }
  }

  async getUserInfo(accessToken: string): Promise<InstagramUserInfo> {
    try {
      const params = {
        fields:
          'user_id,username,account_type,profile_picture_url,followers_count',
        access_token: accessToken,
      };

      const response = await this.httpClient.get(
        `${GRAPH_URL}/me?${new URLSearchParams(params).toString()}`,
      );

      if (response.data.error) {
        throw new BadRequestException(this.getMetaErrorMessage(response.data));
      }

      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch user information:', error);
      throw new BadRequestException(
        this.getMetaErrorMessage(
          error,
          'Failed to fetch Instagram user information',
        ),
      );
    }
  }

  async getAccessTokenForUser(userId: number): Promise<string> {
    const account = await this.getAccountForUser(userId);
    return account.accessToken;
  }

  async getAccountForUser(userId: number): Promise<SocialAccountWithRelations> {
    const platform = await this.platformReader.findByName(
      PlatformType.INSTAGRAM,
    );
    if (!platform) {
      throw new BadRequestException('Instagram platform not found');
    }

    const accounts = await this.socialAccountReader.findByUserAndPlatform(
      userId,
      platform.id,
    );

    if (!accounts.length) {
      throw new BadRequestException('No Instagram account connected');
    }

    return accounts[0];
  }

  async createReelContainer(params: {
    accessToken: string;
    igUserId: string;
    videoUrl: string;
    caption: string;
    coverUrl?: string;
    shareToFeed: boolean;
    videoId: number;
    platformId: number;
  }): Promise<{ containerId: string }> {
    try {
      const body: Record<string, string | boolean> = {
        media_type: 'REELS',
        video_url: params.videoUrl,
        caption: params.caption,
        share_to_feed: params.shareToFeed,
        access_token: params.accessToken,
      };

      if (params.coverUrl) {
        body.cover_url = params.coverUrl;
      }

      const response = await this.httpClient.post(
        `${GRAPH_URL}/${params.igUserId}/media`,
        body,
      );

      if (response.data.error) {
        throw new BadRequestException(this.getMetaErrorMessage(response.data));
      }

      const containerId = response.data.id;
      if (!containerId) {
        throw new BadRequestException(
          'Instagram did not return a Reel container ID',
        );
      }

      await this.videoPostDraftWriter.create({
        video: { connect: { id: params.videoId } },
        platform: { connect: { id: params.platformId } },
        platformVideoId: containerId,
      });

      return { containerId };
    } catch (error) {
      this.logger.error('Failed to create Instagram Reel container:', error);
      throw new BadRequestException(
        this.getMetaErrorMessage(
          error,
          'Failed to prepare Instagram Reel upload',
        ),
      );
    }
  }

  async getContainerStatus(
    accessToken: string,
    containerId: string,
  ): Promise<InstagramContainerStatus> {
    try {
      const params = {
        fields: 'status_code,status',
        access_token: accessToken,
      };
      const response = await this.httpClient.get(
        `${GRAPH_URL}/${containerId}?${new URLSearchParams(params).toString()}`,
      );

      if (response.data.error) {
        throw new BadRequestException(this.getMetaErrorMessage(response.data));
      }

      const statusCode = response.data
        .status_code as InstagramContainerStatusCode;
      const result: InstagramContainerStatus = {
        containerId,
        statusCode,
        status: response.data.status,
      };

      if (statusCode === 'FINISHED') {
        const draft =
          await this.videoPostDraftReader.findByPlatformVideoId(containerId);
        if (draft && !draft.uploadCompletedAt) {
          await this.videoPostDraftWriter.markUploadCompleted(draft.id);
        }
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to fetch Instagram container status:', error);
      throw new BadRequestException(
        this.getMetaErrorMessage(
          error,
          'Failed to fetch Instagram upload status',
        ),
      );
    }
  }

  async publishContainer(params: {
    accessToken: string;
    igUserId: string;
    containerId: string;
    videoId: number;
    platformId: number;
    socialAccountId: number;
  }): Promise<{ mediaId: string; permalink: string }> {
    try {
      const response = await this.httpClient.post(
        `${GRAPH_URL}/${params.igUserId}/media_publish`,
        {
          creation_id: params.containerId,
          access_token: params.accessToken,
        },
      );

      if (response.data.error) {
        throw new BadRequestException(this.getMetaErrorMessage(response.data));
      }

      const mediaId = response.data.id;
      if (!mediaId) {
        throw new BadRequestException(
          'Instagram did not return a published media ID',
        );
      }

      const mediaResponse = await this.httpClient.get(
        `${GRAPH_URL}/${mediaId}?${new URLSearchParams({
          fields: 'permalink',
          access_token: params.accessToken,
        }).toString()}`,
      );

      if (mediaResponse.data.error) {
        throw new BadRequestException(
          this.getMetaErrorMessage(mediaResponse.data),
        );
      }

      const permalink = mediaResponse.data.permalink;
      if (!permalink) {
        throw new BadRequestException(
          'Instagram did not return a permalink for the published Reel',
        );
      }

      await this.videoPostWriter.create({
        video: { connect: { id: params.videoId } },
        platform: { connect: { id: params.platformId } },
        socialAccount: { connect: { id: params.socialAccountId } },
        platformPostId: mediaId,
        postUrl: permalink,
        status: PostStatus.PUBLISHED,
        postedAt: new Date(),
      });

      return { mediaId, permalink };
    } catch (error) {
      this.logger.error('Failed to publish Instagram Reel:', error);
      throw new BadRequestException(
        this.getMetaErrorMessage(error, 'Failed to publish Instagram Reel'),
      );
    }
  }

  async getPublishingLimit(
    accessToken: string,
    igUserId: string,
  ): Promise<InstagramPublishingLimit> {
    try {
      const params = {
        fields: 'config,quota_usage',
        access_token: accessToken,
      };
      const response = await this.httpClient.get(
        `${GRAPH_URL}/${igUserId}/content_publishing_limit?${new URLSearchParams(params).toString()}`,
      );

      if (response.data.error) {
        throw new BadRequestException(this.getMetaErrorMessage(response.data));
      }

      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch Instagram publishing limit:', error);
      throw new BadRequestException(
        this.getMetaErrorMessage(
          error,
          'Failed to fetch Instagram publishing limit',
        ),
      );
    }
  }

  validateReelVideo(
    video: {
      mimeType?: string | null;
      duration?: number | null;
      fileSize?: number | null;
    },
    caption?: string | null,
  ): void {
    if (
      video.mimeType != null &&
      !['video/mp4', 'video/quicktime'].includes(video.mimeType)
    ) {
      throw new BadRequestException(
        'Instagram Reels require an MP4 or QuickTime video',
      );
    }

    if (
      video.duration != null &&
      (video.duration < 3 || video.duration > 900)
    ) {
      throw new BadRequestException(
        'Instagram Reels must be between 3 and 900 seconds long',
      );
    }

    if (video.fileSize != null && video.fileSize > 300 * 1024 * 1024) {
      throw new BadRequestException(
        'Instagram Reels must be smaller than 300 MB',
      );
    }

    if (caption != null && caption.length > 2200) {
      throw new BadRequestException(
        'Instagram Reel captions must be 2200 characters or fewer',
      );
    }
  }

  private getMetaErrorMessage(
    error: unknown,
    fallback = 'Instagram API request failed',
  ) {
    const responseData = (
      error as { response?: { data?: InstagramApiErrorResponse } }
    )?.response?.data;
    const errorWithMessage = error as { message?: string };

    return (
      responseData?.error?.error_user_msg ||
      responseData?.error?.message ||
      responseData?.error_user_msg ||
      responseData?.message ||
      (error instanceof BadRequestException ? error.message : undefined) ||
      errorWithMessage?.message ||
      fallback
    );
  }
}
