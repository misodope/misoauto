import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { SocialAccountWriter } from '@backend/social-accounts/repository/social-account-writer';
import { SocialAccountReader } from '@backend/social-accounts/repository/social-account-reader';
import { PlatformReader } from '../repository/platform-reader';
import {
  PlatformType,
  PostStatus,
  Prisma,
  UploadMode,
} from '@backend/generated/prisma/client';
import { VideoPostDraftWriter } from '@backend/video-posts/repository/video-post-draft-writer';
import { VideoPostReader } from '@backend/video-posts/repository/video-post-reader';
import { VideoPostWriter } from '@backend/video-posts/repository/video-post-writer';
import { SocialAccountWithRelations } from '@backend/social-accounts/repository/social-account-reader';
import {
  TikTokApiException,
  TikTokCreatorInfo,
  TikTokDirectPostOptions,
  assertTikTokOk,
  toTikTokApiException,
  toTikTokPostInfo,
  validateTikTokDirectPost,
} from './tiktok-direct-post';

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
    private readonly videoPostWriter: VideoPostWriter,
    private readonly videoPostReader: VideoPostReader,
  ) {
    const isDev = process.env.NODE_ENV !== 'production';

    this.config = {
      clientId: process.env.TIKTOK_CLIENT_ID || '',
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
      redirectUri:
        (isDev && process.env.TIKTOK_REDIRECT_URI_DEV) ||
        process.env.TIKTOK_REDIRECT_URI ||
        '',
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

      // Stats fields require the user.info.stats scope requested during OAuth.
      const fields =
        'open_id,union_id,avatar_url,avatar_url_100,avatar_large_url,display_name,follower_count,following_count,likes_count,video_count';

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

  async getAccessTokenForUser(
    userId: number,
    socialAccountId?: number,
  ): Promise<string> {
    const account = await this.getAccountForUser(userId, socialAccountId);
    if (!account.accessToken) {
      throw new BadRequestException('TikTok account has no usable token');
    }
    return account.accessToken;
  }

  /**
   * Returns the user's TikTok account. Pass `socialAccountId` whenever the
   * user picked an account, so posts never land on a different one.
   */
  async getAccountForUser(
    userId: number,
    socialAccountId?: number,
  ): Promise<SocialAccountWithRelations> {
    const platform = await this.platformReader.findByName(PlatformType.TIKTOK);
    if (!platform) {
      throw new BadRequestException('TikTok platform not found');
    }

    if (socialAccountId !== undefined) {
      const account = await this.socialAccountReader.findOne({
        id: socialAccountId,
      });
      if (
        !account ||
        account.userId !== userId ||
        account.platformId !== platform.id
      ) {
        throw new BadRequestException('TikTok account not found');
      }
      if (!account.accessToken) {
        throw new BadRequestException('TikTok account has no usable token');
      }
      return account;
    }

    const accounts = await this.socialAccountReader.findByUserAndPlatform(
      userId,
      platform.id,
    );

    if (!accounts.length) {
      throw new BadRequestException('No TikTok account connected');
    }

    if (!accounts[0].accessToken) {
      throw new BadRequestException('TikTok account has no usable token');
    }

    return accounts[0];
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
      const platform = await this.platformReader.findByName(
        PlatformType.TIKTOK,
      );
      if (!platform) {
        throw new BadRequestException('TikTok platform not found in database');
      }

      // TikTok will fetch the video from the provided URL, so we provide a signed R2 URL for the draft video
      this.logger.debug(`Video URL for TikTok to pull: ${videoUrl}`);

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

      assertTikTokOk(response.data);

      await this.videoPostDraftWriter.create({
        video: {
          connect: {
            id: videoId,
          },
        },
        platform: {
          connect: {
            id: platform.id,
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
      throw toTikTokApiException(
        error,
        'Failed to initialize TikTok video upload',
      );
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

      assertTikTokOk(response.data);

      this.logger.log(
        `Publish status for ${publishId}: ${response.data.data.status}`,
      );
      return response.data.data;
    } catch (error) {
      this.logger.error('Failed to fetch publish status:', error);
      throw toTikTokApiException(
        error,
        'Failed to fetch TikTok publish status',
      );
    }
  }

  /**
   * Latest posting settings for the creator. TikTok requires fetching this
   * every time the Post to TikTok screen renders, so it is never cached.
   */
  async queryCreatorInfo(accessToken: string): Promise<TikTokCreatorInfo> {
    try {
      const response = await this.httpClient.post(
        'https://open.tiktokapis.com/v2/post/publish/creator_info/query/',
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
          },
        },
      );

      assertTikTokOk(response.data);
      return response.data.data;
    } catch (error) {
      this.logger.error('Failed to query TikTok creator info:', error);
      throw toTikTokApiException(error, 'Failed to load TikTok account info');
    }
  }

  /**
   * Publishes straight to the creator's profile with Direct Post. The post is
   * recorded as PUBLISHING with TikTok's publish_id until a status check sees
   * it finish (see syncDirectPostStatus).
   *
   * The init call is never retried: each successful init is a real post that
   * counts against the creator's daily cap, and a timed-out request may still
   * have gone through.
   */
  async initializeDirectPost(params: {
    account: SocialAccountWithRelations;
    videoId: number;
    videoUrl: string;
    videoDurationSec: number | null;
    caption: string | null;
    options: TikTokDirectPostOptions;
  }): Promise<{ publishId: string; videoPostId: number }> {
    const { account, videoId, videoUrl, videoDurationSec, caption, options } =
      params;

    if (!account.accessToken) {
      throw new BadRequestException('TikTok account has no usable token');
    }
    const accessToken = account.accessToken;
    const creatorInfo = await this.queryCreatorInfo(accessToken);
    const errors = validateTikTokDirectPost({
      caption,
      options,
      creatorInfo,
      videoDurationSec,
    });
    if (errors.length) {
      throw new TikTokApiException(errors.join('. '));
    }

    let publishId: string;
    try {
      this.logger.log(
        `Initializing TikTok Direct Post for video ${videoId} on account ${account.id}`,
      );
      const response = await this.httpClient.post(
        'https://open.tiktokapis.com/v2/post/publish/video/init/',
        {
          post_info: toTikTokPostInfo(caption, options, creatorInfo),
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

      assertTikTokOk(response.data);
      publishId = response.data.data.publish_id;
    } catch (error) {
      this.logger.error('Failed to initialize TikTok Direct Post:', error);
      if ((error as { code?: string })?.code === 'ECONNABORTED') {
        throw new TikTokApiException(
          'TikTok did not respond in time. Check your TikTok profile before trying again, as the video may still post.',
        );
      }
      throw toTikTokApiException(error, 'Failed to post to TikTok');
    }

    const post = await this.videoPostWriter.createForActiveAccount(
      {
        video: { connect: { id: videoId } },
        platform: { connect: { id: account.platformId } },
        socialAccount: { connect: { id: account.id } },
        // Holds TikTok's publish_id until the public post id is known.
        platformPostId: publishId,
        status: PostStatus.PUBLISHING,
        uploadMode: UploadMode.DIRECT,
        caption,
        options: options as unknown as Prisma.InputJsonValue,
      },
      account.id,
    );

    this.logger.log(`TikTok Direct Post started, publish_id: ${publishId}`);
    return { publishId, videoPostId: post.id };
  }

  /**
   * Moves a Direct Post's record to PUBLISHED or FAILED once TikTok reports a
   * final status. Inbox drafts have no VideoPost record and are left alone.
   */
  async syncDirectPostStatus(
    userId: number,
    publishId: string,
    status: TikTokPublishStatusResponse,
  ): Promise<{ postUrl: string | null }> {
    const post = await this.videoPostReader.findByPlatformPostId(publishId);
    if (!post || post.socialAccount.userId !== userId) {
      return { postUrl: null };
    }
    if (post.status !== PostStatus.PUBLISHING) {
      return { postUrl: post.postUrl };
    }

    if (status.status === 'FAILED') {
      await this.videoPostWriter.update({
        where: { id: post.id },
        data: { status: PostStatus.FAILED },
      });
      return { postUrl: null };
    }

    if (status.status !== 'PUBLISH_COMPLETE') {
      return { postUrl: null };
    }

    // Private ("Only me") posts never get a public id.
    const publicPostId = status.publicaly_available_post_id?.[0];
    let postUrl: string | null = null;
    if (publicPostId) {
      try {
        const account = await this.socialAccountReader.findOne({
          id: post.socialAccount.id,
        });
        if (account?.accessToken) {
          const creatorInfo = await this.queryCreatorInfo(account.accessToken);
          postUrl = `https://www.tiktok.com/@${creatorInfo.creator_username}/video/${publicPostId}`;
        }
      } catch (error) {
        this.logger.warn(
          `Could not build the TikTok post URL for ${publishId}: ${String(error)}`,
        );
      }
    }

    await this.videoPostWriter.update({
      where: { id: post.id },
      data: {
        status: PostStatus.PUBLISHED,
        postedAt: new Date(),
        ...(publicPostId ? { platformPostId: String(publicPostId) } : {}),
        ...(postUrl ? { postUrl } : {}),
      },
    });

    return { postUrl };
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
        await this.socialAccountReader.findIncludingDeletedByPlatformAndAccountId(
          platform.id,
          params.tokenResponse.open_id,
        );

      let savedAccount;
      if (existingAccount) {
        if (existingAccount.userId !== params.userId) {
          throw new ConflictException('TikTok account is already connected');
        }

        // Update existing account with new tokens
        this.logger.log(
          `Updating existing TikTok account ${existingAccount.id}`,
        );
        if (existingAccount.deletedAt) {
          savedAccount = await this.socialAccountWriter.reactivateWithTokens({
            id: existingAccount.id,
            userId: params.userId,
            accessToken: params.tokenResponse.access_token,
            refreshToken: params.tokenResponse.refresh_token,
            tokenExpiry,
          });
        } else {
          savedAccount = await this.socialAccountWriter.updateTokens({
            id: existingAccount.id,
            accessToken: params.tokenResponse.access_token,
            refreshToken: params.tokenResponse.refresh_token,
            tokenExpiry,
            expectedTokenVersion: existingAccount.tokenVersion,
          });
        }

        if (!savedAccount) {
          throw new ConflictException(
            'TikTok account changed while connecting; please try again',
          );
        }
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
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Failed to save TikTok account:', error);
      throw new BadRequestException('Failed to save TikTok account');
    }
  }
}
